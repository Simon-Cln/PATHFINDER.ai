# PathFinder.ai

> **Empowering EFREI students** to find internships that match their CV and aspirations.  
> Upload your resume, discover relevant internships, and generate personalized cover letters—efficiently.

---

## Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Installation & Setup](#installation--setup)
5. [Usage](#usage)
6. [Interface Preview](#interface-preview)
7. [Roadmap](#roadmap)
8. [Contributing](#contributing)
9. [License](#license)

---

## Overview

**PathFinder.ai** is a web application designed to assist EFREI students in finding internships that best align with their uploaded CV and personal goals. For every internship found, the system can generate a customized cover letter template, reducing the time and effort required in the application process.

---

## Key Features

- **Resume Upload**  
  Students can upload their resume in various formats (PDF, DOC, DOCX, or TXT). The platform extracts key skills and experiences using advanced NLP techniques.
  
- **Internship Matching**  
  A real-time matching score indicates how well each internship offer corresponds to the student's profile.
  
- **Dashboard & Stats**  
  - Total number of internship matches  
  - Matching rate (`NaN%`)  
  - Profile completion (`0%`)  
  
- **Cover Letter Generator**  
  Instantly generate tailored cover letters for each internship offer, leveraging the skills and requirements extracted from the CV and the job post.
  
- **Chatbot Interaction**  
  A friendly chatbot named PathFinder guides students, answers questions, and helps refine internship searches based on their preferences and CV analysis.

---

## Tech Stack

### Frontend
- **Next.js**  
- **TypeScript**  
- **Tailwind CSS**

### Backend
- **Node.js / Express**  
  _(Could also integrate Python for advanced NLP services)_  

### NLP / AI Tools
- **spaCy** / **HuggingFace** / **GPT** (or any other NLP library you prefer)

### Database
- **MongoDB** or **PostgreSQL** (depending on your storage preference)

---

## Installation & Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Simon-Cln/PATHFINDER.ai.git
   cd PATHFINDER

