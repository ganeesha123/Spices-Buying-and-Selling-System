🌿 CeloSpice — Authentic Spice Buying and Selling System
> A full-stack e-commerce web platform connecting Sri Lankan spice sellers directly with buyers, built with the MERN stack.
---
📌 Project Info
Detail	Info
Subject	IT2080 – IT Project (ITP)
Group ID	ITP25_B4_85
Year / Sem	2nd Year, 2nd Semester
University	Sri Lanka Institute of Information Technology (SLIIT)
Methodology	Agile (Scrum)
---
👥 Team Members
Reg. No.	Name
IT23820678	K.B.G.L. Ravihara
IT23818866	R.P.S.N. Rajapaksha
IT23754270	Gunawardhana B.Y.A
IT23813366	Chamathki E.G.G.J
IT23821040	Nimantha L.N.A.I
---
🎯 Project Overview
Sri Lanka is globally renowned for its high-quality spices — cinnamon, pepper, cardamom, and cloves. However, small-scale spice farmers struggle to find fair-priced buyers, often being forced to depend on middlemen who reduce their profits.
CeloSpice is a digital marketplace that connects verified Sri Lankan spice sellers directly with buyers — eliminating middlemen, promoting transparency, and ensuring fair pricing.
---
✨ Key Features
  👤 User Management
Role-based registration: Buyer / Seller / Delivery Person / Admin
Secure login with email & NIC verification
Role-specific dashboards
  🛒 Product Management
Sellers can list, update, and manage spice products
Advanced filtering by category, location, and quantity
Product quality verification with GAP & Organic Certifications
  💳 Payment System
Secure payment gateway integration
Receipt generation and transaction history
Refund handling
  📦 Order & Delivery System
Order placement and tracking
Auto-assign delivery agents based on location
Real-time order status updates (email/SMS)
  ⭐ Review & Rating System
Buyers can rate sellers and delivery service
Public review display on product/seller pages
  🎧 Customer Support
Support ticket system
  FAQ section
Admin monitoring of complaints
  🌐 Multilingual Support
English, Sinhala, and Tamil language support
---
🛠️ Tech Stack
Layer	Technology
Frontend	React.js
Backend	Node.js, Express.js
Database	MongoDB
API	REST API
Version Control	GitHub
IDE	Visual Studio Code
API Testing	Postman
Deployment	Heroku
Communication	Microsoft Teams, WhatsApp
---
📁 Project Structure
```
Spices-Buying-and-Selling-System/
├── frontend/          # React.js frontend
├── backend/           # Node.js + Express.js backend
├── MONGODB_ATLAS_SETUP.md
└── README.md
```
---
🚀 Getting Started
Prerequisites
Node.js
MongoDB (local or Atlas)
npm
Installation
1. Clone the repo
```bash
git clone https://github.com/ganeesha123/Spices-Buying-and-Selling-System.git
```
2. Setup Backend
```bash
cd backend
npm install
```
Create a `.env` file in `/backend`:
```
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_secret_key
```
```bash
npm start
```
3. Setup Frontend
```bash
cd frontend
npm install
npm start
```
---
📋 System Modules
User Management — Registration, login, role-based access
Product Management — Listings, inventory, quality verification
Payment System — Gateway, receipts, refunds
Order & Delivery — Tracking, assignment, notifications
Customer Support — Tickets, FAQ, complaint handling
---
📄 License
This project was developed for academic purposes at SLIIT.
