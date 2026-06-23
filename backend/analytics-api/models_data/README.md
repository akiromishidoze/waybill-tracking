# ML Models Directory

This directory stores serialized machine-learning models used by the analytics API.

Models are generated at runtime by `app.services.ml_service.MLService` when the `train()` method is called with sufficient historical delivery data. The expected files are:

- `eta_model.pkl` — RandomForest regressor for ETA prediction
- `anomaly_model.pkl` — IsolationForest for anomaly detection
- `encoders.pkl` — Fitted `LabelEncoder`s for categorical features

If these files are absent, the service falls back to SQL-based historical averages and stuck-shipment rules so the API continues to function.
