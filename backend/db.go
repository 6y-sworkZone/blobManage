package main

import (
	"database/sql"
	"log"
)

var db *sql.DB

func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "./blog.db")
	if err != nil {
		log.Fatal(err)
	}

	createTables()
	insertInitialData()
}

func createTables() {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			role TEXT DEFAULT 'user',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			slug TEXT UNIQUE NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			slug TEXT UNIQUE NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS articles (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			excerpt TEXT,
			slug TEXT UNIQUE NOT NULL,
			category_id INTEGER,
			author_id INTEGER,
			status TEXT DEFAULT 'draft',
			view_count INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			published_at DATETIME,
			FOREIGN KEY (category_id) REFERENCES categories(id),
			FOREIGN KEY (author_id) REFERENCES users(id)
		)`,
		`CREATE TABLE IF NOT EXISTS article_tags (
			article_id INTEGER,
			tag_id INTEGER,
			PRIMARY KEY (article_id, tag_id),
			FOREIGN KEY (article_id) REFERENCES articles(id),
			FOREIGN KEY (tag_id) REFERENCES tags(id)
		)`,
		`CREATE TABLE IF NOT EXISTS comments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			article_id INTEGER NOT NULL,
			user_id INTEGER,
			content TEXT NOT NULL,
			parent_id INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			status TEXT DEFAULT 'pending',
			FOREIGN KEY (article_id) REFERENCES articles(id),
			FOREIGN KEY (user_id) REFERENCES users(id),
			FOREIGN KEY (parent_id) REFERENCES comments(id)
		)`,
		`CREATE TABLE IF NOT EXISTS drafts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER UNIQUE NOT NULL,
			title TEXT,
			content TEXT,
			data TEXT,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)`,
	}

	for _, q := range queries {
		_, err := db.Exec(q)
		if err != nil {
			log.Printf("Error creating table: %v", err)
		}
	}
}

func insertInitialData() {
	var count int
	db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if count == 0 {
		db.Exec(`INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
			"admin", "a****@**********", "admin123", "admin")
	}

	db.QueryRow("SELECT COUNT(*) FROM categories").Scan(&count)
	if count == 0 {
		db.Exec(`INSERT INTO categories (name, slug) VALUES (?, ?)`, "技术", "tech")
		db.Exec(`INSERT INTO categories (name, slug) VALUES (?, ?)`, "生活", "life")
		db.Exec(`INSERT INTO categories (name, slug) VALUES (?, ?)`, "随笔", "essay")
	}

	db.QueryRow("SELECT COUNT(*) FROM tags").Scan(&count)
	if count == 0 {
		db.Exec(`INSERT INTO tags (name, slug) VALUES (?, ?)`, "Go", "go")
		db.Exec(`INSERT INTO tags (name, slug) VALUES (?, ?)`, "React", "react")
		db.Exec(`INSERT INTO tags (name, slug) VALUES (?, ?)`, "编程", "programming")
	}
}
