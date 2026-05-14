package main

import (
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

type Article struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	Excerpt     string    `json:"excerpt"`
	Slug        string    `json:"slug"`
	CategoryID  int       `json:"category_id"`
	AuthorID    int       `json:"author_id"`
	Status      string    `json:"status"`
	ViewCount   int       `json:"view_count"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	PublishedAt time.Time `json:"published_at"`
}

type Category struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	CreatedAt time.Time `json:"created_at"`
}

type Tag struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type Comment struct {
	ID        int       `json:"id"`
	ArticleID int       `json:"article_id"`
	UserID    int       `json:"user_id"`
	Content   string    `json:"content"`
	ParentID  int       `json:"parent_id"`
	CreatedAt time.Time `json:"created_at"`
	Status    string    `json:"status"`
}

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Password  string    `json:"password,omitempty"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type Draft struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Data      string    `json:"data"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ArticleRequest struct {
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	Excerpt     string    `json:"excerpt"`
	Slug        string    `json:"slug"`
	CategoryID  int       `json:"category_id"`
	AuthorID    int       `json:"author_id"`
	Status      string    `json:"status"`
	TagIDs      []int     `json:"tag_ids"`
}

func main() {
	initDB()
	defer db.Close()

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api")
	{
		articles := api.Group("/articles")
		{
			articles.GET("", getArticles)
			articles.GET("/:id", getArticle)
			articles.POST("", createArticle)
			articles.PUT("/:id", updateArticle)
			articles.DELETE("/:id", deleteArticle)
			articles.GET("/slug/:slug", getArticleBySlug)
			articles.GET("/:id/tags", getArticleTags)
		}

		categories := api.Group("/categories")
		{
			categories.GET("", getCategories)
			categories.POST("", createCategory)
			categories.PUT("/:id", updateCategory)
			categories.DELETE("/:id", deleteCategory)
		}

		tags := api.Group("/tags")
		{
			tags.GET("", getTags)
			tags.POST("", createTag)
			tags.DELETE("/:id", deleteTag)
		}

		comments := api.Group("/comments")
		{
			comments.GET("", getComments)
			comments.POST("", createComment)
			comments.PUT("/:id", updateComment)
			comments.DELETE("/:id", deleteComment)
		}

		users := api.Group("/users")
		{
			users.GET("", getUsers)
			users.POST("", createUser)
			users.PUT("/:id", updateUser)
			users.DELETE("/:id", deleteUser)
		}

		drafts := api.Group("/drafts")
		{
			drafts.GET("/:user_id", getDraft)
			drafts.POST("", saveDraft)
			drafts.DELETE("/:user_id", deleteDraft)
		}

		api.GET("/search", searchArticles)
	}

	port := "57832"
	log.Printf("Server starting on port %s...", port)
	r.Run(":" + port)
}

func getArticles(c *gin.Context) {
	status := c.Query("status")
	categoryID := c.Query("category_id")
	tagID := c.Query("tag_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	query := `SELECT a.id, a.title, a.content, a.excerpt, a.slug, a.category_id, a.author_id, a.status, a.view_count, a.created_at, a.updated_at, a.published_at 
	          FROM articles a WHERE 1=1`
	args := []interface{}{}

	if status != "" {
		query += " AND a.status = ?"
		args = append(args, status)
	}
	if categoryID != "" {
		query += " AND a.category_id = ?"
		args = append(args, categoryID)
	}
	if tagID != "" {
		query += " AND EXISTS (SELECT 1 FROM article_tags at WHERE at.article_id = a.id AND at.tag_id = ?)"
		args = append(args, tagID)
	}

	query += " ORDER BY a.created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var articles []Article
	for rows.Next() {
		var a Article
		err := rows.Scan(&a.ID, &a.Title, &a.Content, &a.Excerpt, &a.Slug, &a.CategoryID, &a.AuthorID, &a.Status, &a.ViewCount, &a.CreatedAt, &a.UpdatedAt, &a.PublishedAt)
		if err != nil {
			continue
		}
		articles = append(articles, a)
	}

	c.JSON(http.StatusOK, articles)
}

func getArticle(c *gin.Context) {
	id := c.Param("id")
	var a Article
	err := db.QueryRow(`SELECT id, title, content, excerpt, slug, category_id, author_id, status, view_count, created_at, updated_at, published_at 
	                    FROM articles WHERE id = ?`, id).Scan(&a.ID, &a.Title, &a.Content, &a.Excerpt, &a.Slug, &a.CategoryID, &a.AuthorID, &a.Status, &a.ViewCount, &a.CreatedAt, &a.UpdatedAt, &a.PublishedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}
	c.JSON(http.StatusOK, a)
}

func getArticleBySlug(c *gin.Context) {
	slug := c.Param("slug")
	var a Article
	err := db.QueryRow(`SELECT id, title, content, excerpt, slug, category_id, author_id, status, view_count, created_at, updated_at, published_at 
	                    FROM articles WHERE slug = ?`, slug).Scan(&a.ID, &a.Title, &a.Content, &a.Excerpt, &a.Slug, &a.CategoryID, &a.AuthorID, &a.Status, &a.ViewCount, &a.CreatedAt, &a.UpdatedAt, &a.PublishedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}
	c.JSON(http.StatusOK, a)
}

func createArticle(c *gin.Context) {
	var req ArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Slug == "" {
		req.Slug = generateSlug(req.Title)
	}
	now := time.Now()

	result, err := db.Exec(`INSERT INTO articles (title, content, excerpt, slug, category_id, author_id, status, view_count, created_at, updated_at, published_at) 
	                        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
		req.Title, req.Content, req.Excerpt, req.Slug, req.CategoryID, req.AuthorID, req.Status, now, now, now)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	articleID, _ := result.LastInsertId()

	for _, tagID := range req.TagIDs {
		_, err := db.Exec("INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)", articleID, tagID)
		if err != nil {
			log.Printf("Failed to insert article_tag: %v", err)
		}
	}

	a := Article{
		ID:          int(articleID),
		Title:       req.Title,
		Content:     req.Content,
		Excerpt:     req.Excerpt,
		Slug:        req.Slug,
		CategoryID:  req.CategoryID,
		AuthorID:    req.AuthorID,
		Status:      req.Status,
		CreatedAt:   now,
		UpdatedAt:   now,
		PublishedAt: now,
	}
	c.JSON(http.StatusCreated, a)
}

func updateArticle(c *gin.Context) {
	id := c.Param("id")
	var req ArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	now := time.Now()
	publishedAt := now
	if req.Status != "published" {
		publishedAt = time.Time{}
	}

	_, err := db.Exec(`UPDATE articles SET title=?, content=?, excerpt=?, slug=?, category_id=?, status=?, updated_at=?, published_at=? WHERE id=?`,
		req.Title, req.Content, req.Excerpt, req.Slug, req.CategoryID, req.Status, now, publishedAt, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_, err = db.Exec("DELETE FROM article_tags WHERE article_id = ?", id)
	if err != nil {
		log.Printf("Failed to delete old article_tags: %v", err)
	}

	for _, tagID := range req.TagIDs {
		_, err := db.Exec("INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)", id, tagID)
		if err != nil {
			log.Printf("Failed to insert article_tag: %v", err)
		}
	}

	a := Article{
		ID:          0,
		Title:       req.Title,
		Content:     req.Content,
		Excerpt:     req.Excerpt,
		Slug:        req.Slug,
		CategoryID:  req.CategoryID,
		AuthorID:    req.AuthorID,
		Status:      req.Status,
		UpdatedAt:   now,
		PublishedAt: publishedAt,
	}
	c.JSON(http.StatusOK, a)
}

func deleteArticle(c *gin.Context) {
	id := c.Param("id")
	_, err := db.Exec("DELETE FROM article_tags WHERE article_id = ?", id)
	if err != nil {
		log.Printf("Failed to delete article_tags: %v", err)
	}
	_, err = db.Exec("DELETE FROM articles WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}

func getArticleTags(c *gin.Context) {
	id := c.Param("id")
	rows, err := db.Query(`
		SELECT t.id, t.name, t.slug 
		FROM tags t 
		INNER JOIN article_tags at ON t.id = at.tag_id 
		WHERE at.article_id = ?
	`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var tags []Tag
	for rows.Next() {
		var t Tag
		err := rows.Scan(&t.ID, &t.Name, &t.Slug)
		if err != nil {
			continue
		}
		tags = append(tags, t)
	}
	c.JSON(http.StatusOK, tags)
}

func getCategories(c *gin.Context) {
	rows, err := db.Query("SELECT id, name, slug, created_at FROM categories ORDER BY name")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var cat Category
		err := rows.Scan(&cat.ID, &cat.Name, &cat.Slug, &cat.CreatedAt)
		if err != nil {
			continue
		}
		categories = append(categories, cat)
	}
	c.JSON(http.StatusOK, categories)
}

func createCategory(c *gin.Context) {
	var cat Category
	if err := c.ShouldBindJSON(&cat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if cat.Slug == "" {
		cat.Slug = generateSlug(cat.Name)
	}
	cat.CreatedAt = time.Now()

	result, err := db.Exec("INSERT INTO categories (name, slug, created_at) VALUES (?, ?, ?)", cat.Name, cat.Slug, cat.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	id, _ := result.LastInsertId()
	cat.ID = int(id)
	c.JSON(http.StatusCreated, cat)
}

func updateCategory(c *gin.Context) {
	id := c.Param("id")
	var cat Category
	if err := c.ShouldBindJSON(&cat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_, err := db.Exec("UPDATE categories SET name=?, slug=? WHERE id=?", cat.Name, cat.Slug, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cat)
}

func deleteCategory(c *gin.Context) {
	id := c.Param("id")
	_, err := db.Exec("DELETE FROM categories WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}

func getTags(c *gin.Context) {
	rows, err := db.Query("SELECT id, name, slug FROM tags ORDER BY name")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var tags []Tag
	for rows.Next() {
		var t Tag
		err := rows.Scan(&t.ID, &t.Name, &t.Slug)
		if err != nil {
			continue
		}
		tags = append(tags, t)
	}
	c.JSON(http.StatusOK, tags)
}

func createTag(c *gin.Context) {
	var t Tag
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if t.Slug == "" {
		t.Slug = generateSlug(t.Name)
	}

	result, err := db.Exec("INSERT INTO tags (name, slug) VALUES (?, ?)", t.Name, t.Slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	id, _ := result.LastInsertId()
	t.ID = int(id)
	c.JSON(http.StatusCreated, t)
}

func deleteTag(c *gin.Context) {
	id := c.Param("id")
	_, err := db.Exec("DELETE FROM tags WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}

func getComments(c *gin.Context) {
	articleID := c.Query("article_id")
	query := `SELECT id, article_id, user_id, content, parent_id, created_at, status FROM comments WHERE 1=1`
	args := []interface{}{}
	if articleID != "" {
		query += " AND article_id = ?"
		args = append(args, articleID)
	}
	query += " ORDER BY created_at DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var cmt Comment
		err := rows.Scan(&cmt.ID, &cmt.ArticleID, &cmt.UserID, &cmt.Content, &cmt.ParentID, &cmt.CreatedAt, &cmt.Status)
		if err != nil {
			continue
		}
		comments = append(comments, cmt)
	}
	c.JSON(http.StatusOK, comments)
}

func createComment(c *gin.Context) {
	var cmt Comment
	if err := c.ShouldBindJSON(&cmt); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	cmt.CreatedAt = time.Now()
	cmt.Status = "approved"

	result, err := db.Exec(`INSERT INTO comments (article_id, user_id, content, parent_id, created_at, status) 
	                        VALUES (?, ?, ?, ?, ?, ?)`,
		cmt.ArticleID, cmt.UserID, cmt.Content, cmt.ParentID, cmt.CreatedAt, cmt.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	id, _ := result.LastInsertId()
	cmt.ID = int(id)
	c.JSON(http.StatusCreated, cmt)
}

func updateComment(c *gin.Context) {
	id := c.Param("id")
	var cmt Comment
	if err := c.ShouldBindJSON(&cmt); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_, err := db.Exec("UPDATE comments SET content=?, status=? WHERE id=?", cmt.Content, cmt.Status, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cmt)
}

func deleteComment(c *gin.Context) {
	id := c.Param("id")
	_, err := db.Exec("DELETE FROM comments WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}

func getUsers(c *gin.Context) {
	rows, err := db.Query("SELECT id, username, email, role, created_at FROM users ORDER BY id")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.Role, &u.CreatedAt)
		if err != nil {
			continue
		}
		users = append(users, u)
	}
	c.JSON(http.StatusOK, users)
}

func createUser(c *gin.Context) {
	var u User
	if err := c.ShouldBindJSON(&u); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	u.CreatedAt = time.Now()

	result, err := db.Exec("INSERT INTO users (username, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)",
		u.Username, u.Email, u.Password, u.Role, u.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	id, _ := result.LastInsertId()
	u.ID = int(id)
	u.Password = ""
	c.JSON(http.StatusCreated, u)
}

func updateUser(c *gin.Context) {
	id := c.Param("id")
	var u User
	if err := c.ShouldBindJSON(&u); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_, err := db.Exec("UPDATE users SET username=?, email=?, role=? WHERE id=?", u.Username, u.Email, u.Role, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, u)
}

func deleteUser(c *gin.Context) {
	id := c.Param("id")
	_, err := db.Exec("DELETE FROM users WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}

func getDraft(c *gin.Context) {
	userID := c.Param("user_id")
	var d Draft
	err := db.QueryRow(`SELECT id, user_id, title, content, data, updated_at FROM drafts WHERE user_id = ?`, userID).Scan(
		&d.ID, &d.UserID, &d.Title, &d.Content, &d.Data, &d.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{})
		return
	}
	c.JSON(http.StatusOK, d)
}

func saveDraft(c *gin.Context) {
	var d Draft
	if err := c.ShouldBindJSON(&d); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	d.UpdatedAt = time.Now()

	var exists int
	db.QueryRow("SELECT COUNT(*) FROM drafts WHERE user_id = ?", d.UserID).Scan(&exists)
	var err error
	if exists > 0 {
		_, err = db.Exec(`UPDATE drafts SET title=?, content=?, data=?, updated_at=? WHERE user_id=?`,
			d.Title, d.Content, d.Data, d.UpdatedAt, d.UserID)
	} else {
		_, err = db.Exec(`INSERT INTO drafts (user_id, title, content, data, updated_at) VALUES (?, ?, ?, ?, ?)`,
			d.UserID, d.Title, d.Content, d.Data, d.UpdatedAt)
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, d)
}

func deleteDraft(c *gin.Context) {
	userID := c.Param("user_id")
	_, err := db.Exec("DELETE FROM drafts WHERE user_id = ?", userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Draft deleted"})
}

func searchArticles(c *gin.Context) {
	q := c.Query("q")
	if q == "" {
		c.JSON(http.StatusOK, []Article{})
		return
	}

	query := `SELECT id, title, content, excerpt, slug, category_id, author_id, status, view_count, created_at, updated_at, published_at 
	          FROM articles WHERE status = 'published' AND (title LIKE ? OR content LIKE ?) ORDER BY created_at DESC LIMIT 20`
	search := "%" + q + "%"
	rows, err := db.Query(query, search, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var articles []Article
	for rows.Next() {
		var a Article
		err := rows.Scan(&a.ID, &a.Title, &a.Content, &a.Excerpt, &a.Slug, &a.CategoryID, &a.AuthorID, &a.Status, &a.ViewCount, &a.CreatedAt, &a.UpdatedAt, &a.PublishedAt)
		if err != nil {
			continue
		}
		articles = append(articles, a)
	}
	c.JSON(http.StatusOK, articles)
}

func generateSlug(s string) string {
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, " ", "-")
	s = strings.ReplaceAll(s, "/", "-")
	return s
}
