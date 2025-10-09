# Events API Documentation

## Overview
A complete events management system has been added to your application. This allows you to create, manage, and display events (social events, shows, etc.) with image support and the ability to distinguish between upcoming and past events.

## Features

### Event Properties
Each event includes the following fields:
- **title**: Event name (required)
- **description**: Detailed event description (optional)
- **location**: Event venue or location (optional)
- **eventDate**: Start date and time of the event (required)
- **eventEndDate**: End date and time of the event (optional)
- **imageUrl**: URL to the event image stored in Supabase (optional)
- **isPublished**: Whether the event is visible to the public (default: true)
- **organizer**: Name of the event organizer (optional)
- **ticketPrice**: Price of tickets (optional)
- **ticketLink**: Link to purchase tickets (optional)
- **capacity**: Maximum number of attendees (optional)
- **createdAt**: Timestamp of when the event was created (auto-generated)
- **updatedAt**: Timestamp of last update (auto-generated)

## API Endpoints

### 1. Create Event
**POST** `/events`

**Authentication**: Required (JWT)

**Content-Type**: `multipart/form-data`

**Body Parameters**:
```json
{
  "title": "Summer Jazz Night",
  "description": "An evening of smooth jazz and great vibes",
  "location": "Bliss Lounge, Downtown",
  "eventDate": "2025-08-15T19:00:00Z",
  "eventEndDate": "2025-08-15T23:00:00Z",
  "organizer": "Bliss Lounge Events",
  "ticketPrice": 25.00,
  "ticketLink": "https://tickets.example.com/summer-jazz",
  "capacity": 150,
  "isPublished": true,
  "image": [FILE]
}
```

**Response**: Created event object

---

### 2. Get All Events
**GET** `/events`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term to filter events by title, description, or location
- `includeUnpublished` (optional): Include unpublished events (default: false)

**Example**: `GET /events?page=1&limit=10&search=jazz`

**Response**: Paginated list of events

---

### 3. Get Upcoming Events
**GET** `/events/upcoming`

Returns only events that haven't passed yet (eventDate >= current date).

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term

**Example**: `GET /events/upcoming?limit=5`

**Response**: Paginated list of upcoming events, sorted by event date (earliest first)

---

### 4. Get Past Events
**GET** `/events/past`

Returns only events that have already passed (eventDate < current date).

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term

**Example**: `GET /events/past?page=1`

**Response**: Paginated list of past events, sorted by event date (most recent first)

---

### 5. Get Single Event
**GET** `/events/:id`

**Example**: `GET /events/123e4567-e89b-12d3-a456-426614174000`

**Response**: Single event object

---

### 6. Check if Event Has Passed
**GET** `/events/:id/is-past`

Returns whether an event has already occurred.

**Example**: `GET /events/123e4567-e89b-12d3-a456-426614174000/is-past`

**Response**: 
```json
{
  "isPast": false
}
```

---

### 7. Update Event
**PATCH** `/events/:id`

**Authentication**: Required (JWT)

**Content-Type**: `multipart/form-data`

**Body Parameters**: Same as Create Event (all optional)

**Example**: `PATCH /events/123e4567-e89b-12d3-a456-426614174000`

**Response**: Updated event object

---

### 8. Delete Event
**DELETE** `/events/:id`

**Authentication**: Required (JWT)

**Example**: `DELETE /events/123e4567-e89b-12d3-a456-426614174000`

**Response**: Success message

---

## Database Schema

The `Event` entity is automatically synced with your PostgreSQL database. The table structure includes:
- All fields mentioned in "Event Properties" section
- UUID primary key (`id`)
- Timestamp columns for tracking creation and updates

## Image Storage

Event images are stored in Supabase Storage under the `menu-items` bucket (you may want to create a dedicated `events` bucket for better organization).

To upload a new bucket for events:
1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket called "events"
4. Make it public if you want the images to be accessible without authentication
5. Update the service code to use "events" instead of "menu-items" (lines 53 and 101 in `events.service.ts`)

## Usage Examples

### Frontend Integration

#### Display Upcoming Events on Homepage
```javascript
fetch('/events/upcoming?limit=5')
  .then(response => response.json())
  .then(data => {
    // data.data contains the events array
    // data.total contains total count
    // data.page contains current page
    // data.limit contains total pages
    displayEvents(data.data);
  });
```

#### Create a New Event (Admin)
```javascript
const formData = new FormData();
formData.append('title', 'Live Music Night');
formData.append('description', 'Great live performances');
formData.append('eventDate', '2025-12-25T20:00:00Z');
formData.append('location', 'Main Hall');
formData.append('image', imageFile); // File object from input

fetch('/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  },
  body: formData
})
.then(response => response.json())
.then(event => console.log('Event created:', event));
```

#### Check if Event Has Passed
```javascript
fetch(`/events/${eventId}/is-past`)
  .then(response => response.json())
  .then(data => {
    if (data.isPast) {
      showPastEventBadge();
    } else {
      showUpcomingEventBadge();
    }
  });
```

## Files Created

1. **Entity**: `src/events/entities/event.entity.ts`
2. **DTOs**: 
   - `src/dto/event/create-event.dto.ts`
   - `src/dto/event/update-event.dto.ts`
   - `src/dto/event/index.ts`
3. **Service**: `src/events/events.service.ts`
4. **Controller**: `src/events/events.controller.ts`
5. **Module**: `src/events/events.module.ts`

## Notes

- All dates should be provided in ISO 8601 format (e.g., `2025-08-15T19:00:00Z`)
- The system automatically determines if an event has passed based on the current date
- Unpublished events are hidden from public endpoints unless `includeUnpublished=true` is specified
- Events are sorted by date (upcoming events show earliest first, past events show most recent first)
- Image uploads are optional but recommended for better visual presentation
- Authentication is required for creating, updating, and deleting events

## Swagger Documentation

All endpoints are documented with Swagger/OpenAPI. Access the interactive API documentation at:
```
http://your-server-url/api
```

This provides a user-friendly interface to test all the event endpoints.

