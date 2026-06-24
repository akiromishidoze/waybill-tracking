package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/waybill-tracking/core-api/internal/models"
	"github.com/waybill-tracking/core-api/internal/repository"
)

type TeamHandler struct {
	repo        *repository.TeamRepository
	waybillRepo *repository.WaybillRepository
}

func NewTeamHandler(repo *repository.TeamRepository, waybillRepo *repository.WaybillRepository) *TeamHandler {
	return &TeamHandler{repo: repo, waybillRepo: waybillRepo}
}

func (h *TeamHandler) List(c *gin.Context) {
	teams, err := h.repo.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, teams)
}

func (h *TeamHandler) Create(c *gin.Context) {
	var req models.Team
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = uuid.New().String()
	team, err := h.repo.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, team)
}

func (h *TeamHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req models.Team
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	team, err := h.repo.Update(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, team)
}

func (h *TeamHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *TeamHandler) AssignToWaybill(c *gin.Context) {
	waybillID := c.Param("id")
	var req models.AssignTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wb, err := h.waybillRepo.GetByID(c.Request.Context(), waybillID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "waybill not found"})
		return
	}

	if err := h.waybillRepo.AssignTeam(c.Request.Context(), waybillID, req.TeamID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	wb.TeamID = req.TeamID
	if req.TeamID != nil {
		team, err := h.repo.GetByID(c.Request.Context(), *req.TeamID)
		if err == nil {
			wb.TeamName = team.Name
		}
	} else {
		wb.TeamName = ""
	}

	c.JSON(http.StatusOK, wb)
}
