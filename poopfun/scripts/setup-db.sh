#!/bin/bash

echo "Setting up PoopFun database..."

# Create database
sqlite3 poopfun.db < backend/src/db/schema.sql

echo "Database created successfully!"
echo "Location: ./poopfun.db"