package storage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type FileStorage struct {
	uploadDir string
	baseURL   string
}

func NewFileStorage(uploadDir, baseURL string) *FileStorage {
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		panic(fmt.Sprintf("failed to create upload directory: %v", err))
	}
	return &FileStorage{
		uploadDir: uploadDir,
		baseURL:   baseURL,
	}
}

func (fs *FileStorage) Save(file io.Reader, filename string) (string, error) {
	// Generate unique filename with timestamp
	ext := filepath.Ext(filename)
	name := strings.TrimSuffix(filename, ext)
	uniqueName := fmt.Sprintf("%s_%d%s", name, time.Now().UnixNano(), ext)
	
	filePath := filepath.Join(fs.uploadDir, uniqueName)
	
	dst, err := os.Create(filePath)
	if err != nil {
		return "", err
	}
	defer dst.Close()
	
	if _, err := io.Copy(dst, file); err != nil {
		return "", err
	}
	
	// Return URL path
	return fmt.Sprintf("%s/%s", fs.baseURL, uniqueName), nil
}

func (fs *FileStorage) Delete(fileURL string) error {
	// Extract filename from URL
	parts := strings.Split(fileURL, "/")
	if len(parts) == 0 {
		return nil
	}
	filename := parts[len(parts)-1]
	filePath := filepath.Join(fs.uploadDir, filename)
	
	return os.Remove(filePath)
}
