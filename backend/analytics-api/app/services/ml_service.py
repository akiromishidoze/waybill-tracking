import logging
import os
import pickle
from datetime import datetime, timedelta
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models_data")
ETA_MODEL_PATH = os.path.join(MODEL_DIR, "eta_model.pkl")
ANOMALY_MODEL_PATH = os.path.join(MODEL_DIR, "anomaly_model.pkl")
ENCODERS_PATH = os.path.join(MODEL_DIR, "encoders.pkl")


class MLService:
    def __init__(self):
        self.eta_model: RandomForestRegressor | None = None
        self.anomaly_model: IsolationForest | None = None
        self.label_encoders: dict[str, LabelEncoder] = {}
        self._trained = False
        os.makedirs(MODEL_DIR, exist_ok=True)
        self._load()

    def _load(self):
        try:
            if os.path.exists(ETA_MODEL_PATH):
                with open(ETA_MODEL_PATH, "rb") as f:
                    self.eta_model = pickle.load(f)
            if os.path.exists(ANOMALY_MODEL_PATH):
                with open(ANOMALY_MODEL_PATH, "rb") as f:
                    self.anomaly_model = pickle.load(f)
            if os.path.exists(ENCODERS_PATH):
                with open(ENCODERS_PATH, "rb") as f:
                    self.label_encoders = pickle.load(f)
            if self.eta_model is not None:
                self._trained = True
        except Exception as e:
            logger.warning("Failed to load ML models: %s", e)

    def _save(self):
        try:
            with open(ETA_MODEL_PATH, "wb") as f:
                pickle.dump(self.eta_model, f)
            with open(ANOMALY_MODEL_PATH, "wb") as f:
                pickle.dump(self.anomaly_model, f)
            with open(ENCODERS_PATH, "wb") as f:
                pickle.dump(self.label_encoders, f)
            self._trained = True
        except Exception as e:
            logger.error("Failed to save ML models: %s", e)

    def _encode(self, df: pd.DataFrame, columns: list[str], fit: bool = False) -> pd.DataFrame:
        df = df.copy()
        for col in columns:
            if col not in df.columns:
                continue
            if fit:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                df[col] = self.label_encoders[col].fit_transform(df[col].astype(str))
            else:
                le = self.label_encoders.get(col)
                if le:
                    known = set(le.classes_)
                    df[col] = df[col].apply(
                        lambda x: le.transform([str(x)])[0] if x in known else -1
                    )
                else:
                    df[col] = -1
        return df

    async def train(self, db: AsyncSession) -> dict[str, Any]:
        result = await db.execute(text("""
            SELECT
                origin, destination, service_type, weight,
                EXTRACT(EPOCH FROM (actual_delivery - created_at)) / 3600 AS transit_hours,
                status, created_at, updated_at
            FROM waybills
            WHERE actual_delivery IS NOT NULL
              AND created_at IS NOT NULL
        """))
        rows = result.mappings().all()
        if not rows:
            return {"status": "skipped", "reason": "No historical delivery data available"}

        df = pd.DataFrame([dict(r) for r in rows])
        df = df.dropna(subset=["transit_hours"])
        df = df[df["transit_hours"] > 0]

        if len(df) < 10:
            return {"status": "skipped", "reason": f"Only {len(df)} samples, need at least 10"}

        cat_cols = ["origin", "destination", "service_type"]
        X = self._encode(df, cat_cols, fit=True)
        feature_cols = cat_cols + ["weight"]
        X = X[feature_cols].fillna(0)
        y_eta = df["transit_hours"]

        self.eta_model = RandomForestRegressor(
            n_estimators=100, max_depth=10, random_state=42, n_jobs=-1
        )
        self.eta_model.fit(X, y_eta)
        eta_score = self.eta_model.score(X, y_eta)

        anomaly_features = feature_cols + ["transit_hours"]
        X_anomaly = X.copy()
        X_anomaly["transit_hours"] = y_eta
        self.anomaly_model = IsolationForest(
            n_estimators=100, contamination=0.05, random_state=42, n_jobs=-1
        )
        self.anomaly_model.fit(X_anomaly)

        self._save()

        return {
            "status": "trained",
            "samples": len(df),
            "eta_r2_score": round(eta_score, 4),
        }

    async def predict_eta(self, db: AsyncSession, waybill_id: str) -> dict[str, Any] | None:
        result = await db.execute(text("""
            SELECT
                id, tracking_number, origin, destination,
                service_type, weight, status, created_at
            FROM waybills WHERE id = :wid
        """), {"wid": waybill_id})
        row = result.mappings().first()
        if not row:
            return None

        if self.eta_model is not None and self._trained:
            df = pd.DataFrame([dict(row)])
            df = self._encode(df, ["origin", "destination", "service_type"])
            features = ["origin", "destination", "service_type", "weight"]
            X = df[features].fillna(0)
            pred_hours = float(self.eta_model.predict(X)[0])
            pred_hours = max(pred_hours, 1.0)
        else:
            avg = await db.execute(text("""
                SELECT AVG(EXTRACT(EPOCH FROM (actual_delivery - created_at)) / 3600)
                FROM waybills
                WHERE status = 'DELIVERED'
                  AND origin = (SELECT origin FROM waybills WHERE id = :wid)
                  AND destination = (SELECT destination FROM waybills WHERE id = :wid)
            """), {"wid": waybill_id})
            avg_hours = avg.scalar()
            pred_hours = float(avg_hours) if avg_hours else 48.0

        confidence = min(0.95, max(0.5, 1.0 - (pred_hours / 168.0)))
        predicted = datetime.utcnow() + timedelta(hours=pred_hours)

        return {
            "waybillId": waybill_id,
            "trackingNumber": row["tracking_number"],
            "predictedDelivery": predicted.isoformat(),
            "confidence": round(confidence, 2),
            "estimatedHours": round(pred_hours, 1),
            "basedOn": "ML model (RandomForest)" if self.eta_model is not None else "Historical average",
        }

    async def detect_anomalies(self, db: AsyncSession) -> list[dict[str, Any]]:
        result = await db.execute(text("""
            SELECT
                id, tracking_number, origin, destination,
                service_type, weight, status, created_at, updated_at
            FROM waybills
            WHERE status NOT IN ('DELIVERED', 'CANCELLED', 'RETURNED')
              AND updated_at < NOW() - INTERVAL '1 day'
            ORDER BY updated_at ASC
        """))
        rows = result.mappings().all()
        if not rows:
            return []

        df = pd.DataFrame([dict(r) for r in rows])
        df["stuck_days"] = (datetime.utcnow() - pd.to_datetime(df["updated_at"])).dt.total_seconds() / 86400

        ml_anomalies: list[dict[str, Any]] = []
        if self.anomaly_model is not None and self._trained:
            try:
                df_encoded = self._encode(df, ["origin", "destination", "service_type"])
                feature_cols = ["origin", "destination", "service_type", "weight", "stuck_days"]
                X = df_encoded[feature_cols].fillna(0)
                preds = self.anomaly_model.predict(X)
                df["ml_anomaly"] = preds == -1
            except Exception as e:
                logger.warning("ML anomaly detection failed: %s", e)
                df["ml_anomaly"] = False
        else:
            df["ml_anomaly"] = False

        anomalies = []
        for _, r in df.iterrows():
            is_stuck = r["stuck_days"] >= 3
            if not is_stuck and not r["ml_anomaly"]:
                continue

            severity = "high" if is_stuck else "medium"
            reasons = []
            if is_stuck:
                reasons.append(f"Stuck in '{r['status']}' for {int(r['stuck_days'])} days")
            if r["ml_anomaly"]:
                reasons.append("Unusual pattern detected by ML model")

            anomalies.append({
                "waybillId": r["id"],
                "trackingNumber": r["tracking_number"],
                "origin": r["origin"],
                "destination": r["destination"],
                "anomalyType": "STUCK_SHIPMENT" if is_stuck else "PATTERN_ANOMALY",
                "severity": severity,
                "description": "; ".join(reasons),
                "detectedAt": datetime.utcnow().isoformat(),
            })

        return anomalies

    @property
    def is_trained(self) -> bool:
        return self._trained


ml_service = MLService()
