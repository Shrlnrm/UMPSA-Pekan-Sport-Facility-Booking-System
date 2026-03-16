# Tech Stack

## 1. Tech Stack Overview
This project uses a specific hybrid stack.
- **Frontend Structure:** Standard HTML5 Tags (Avoid Blade Components like `<x-input>`).
- **Styling:** Tailwind CSS.
- **Interactivity:** Livewire (Used on standard HTML elements).
- **Backend/Logic:** JavaScript.
- **Database:** Supabase ( Connected Through MCP ).
- **Hosting:** GitHub ( Connected Through MCP ).

## 2. FIGMA DESIGN LINK
https://www.figma.com/design/ZZaNH5Kw3EhNFSNOb4hSbA/UMPSA-Pekan-Sport-Facility-Booking-System?node-id=12-1234&t=OuVYRdbgaZrSDMhv-1
( Connected Through MCP )

## 3. DEPLOYMENT
https://github.com/mean1410/UMPSA-Sport-Facility-Booking/actions
( Always ask before push to github because I need to review the code and run it locally first if it is okay I will tell you to push to github )

## 4. DATABASE
https://supabase.com/dashboard/project/rggqjkyjldvjryzhyqjg
( Connected Through MCP )

**Data Dictionary:**
    Below is the data dictionary for the database:

**User Table**
----------------------------------------------
Field        | Data Type    | Null | Key | Description
-------------|--------------|------|-----|---------------------
user_id      | INT(11)      | No   | PK  | Unique ID for the user
email        | VARCHAR(255) | No   |     | User email address
password     | VARCHAR(255) | No   |     | Encrypted password
role         | VARCHAR(20)  | No   |     | User role

**Admin Table**
----------------------------------------------
Field        | Data Type    | Null | Key | Description
-------------|--------------|------|-----|---------------------
admin_id     | INT(11)      | No   | PK  | Unique ID for the admin
email        | VARCHAR(255) | No   |     | Admin email address
password     | VARCHAR(255) | No   |     | Encrypted password
role         | VARCHAR(20)  | No   |     | Administrative role

**Facility Table**
----------------------------------------------
Field        | Data Type    | Null | Key | Description
-------------|--------------|------|-----|---------------------
facility_id  | INT(11)      | No   | PK  | Unique ID for the facility
admin_id     | INT(11)      | No   | FK  | Links to Admin who manages the facility
name         | VARCHAR(100) | No   |     | Facility Name
type         | VARCHAR(50)  | No   |     | Category of facility
status       | VARCHAR(20)  | No   |     | Status (Active/Maintenance)

**Booking Table**
----------------------------------------------
Field        | Data Type    | Null | Key | Description
-------------|--------------|------|-----|---------------------
booking_id   | INT(11)      | No   | PK  | Unique Booking ID
user_id      | INT(11)      | No   | FK  | Links to User Table
facility_id  | INT(11)      | No   | FK  | Links to Facility Table
admin_id     | INT(11)      | Yes  | FK  | Links to Admin (if cancelled by admin)
date         | DATE         | No   |     | Selected booking date
time_slot    | VARCHAR(50)  | No   |     | Selected time slot
purpose      | TEXT         | No   |     | Event purpose
status       | VARCHAR(20)  | No   |     | Confirmed, Pending, or Cancelled

**Schedule Table**
----------------------------------------------
Field        | Data Type    | Null | Key | Description
-------------|--------------|------|-----|---------------------
schedule_id  | INT(11)      | No   | PK  | Unique Schedule ID
facility_id  | INT(11)      | No   | FK  | Links to Facility Table
day_of_week  | VARCHAR(15)  | No   |     | Day (e.g., Monday, Tuesday)
start_time   | TIME         | No   |     | Opening/Start time
end_time     | TIME         | No   |     | Closing/End time
is_available | TINYINT(1)   | No   |     | Availability flag (1=Yes, 0=No)

**Report Table**
----------------------------------------------
Field           | Data Type    | Null | Key | Description
----------------|--------------|------|-----|---------------------
report_id       | INT(11)      | No   | PK  | Unique Report ID
user_id         | INT(11)      | No   | FK  | Links to User Table
facility_id     | INT(11)      | No   | FK  | Links to Facility Table
admin_id        | INT(11)      | Yes  | FK  | Links to Admin (who reviews the report)
issue_description| TEXT        | No   |     | Description of the damage/issue
image_proof     | VARCHAR(255) | Yes  |     | Path/URL to image evidence
status          | VARCHAR(20)  | No   |     | Status (Pending/Resolved)

**Announcement Table**
----------------------------------------------
Field          | Data Type    | Null | Key | Description
---------------|--------------|------|-----|---------------------
announcement_id| INT(11)      | No   | PK  | Unique Announcement ID
admin_id       | INT(11)      | No   | FK  | Links to Admin Table
title          | VARCHAR(255) | No   |     | Announcement Title
content        | TEXT         | No   |     | Main content of the announcement
date_posted    | DATETIME     | No   |     | Date and time posted

## 5. HOSTING
https://mean1410.github.io/UMPSA-Sport-Facility-Booking/

