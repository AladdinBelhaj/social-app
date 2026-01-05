# Requirements
## Summary
A modern social media feed application that allows users to create posts with text and media (photos/videos), interact through reactions (like, love, haha), and engage via comments. The app features a beautiful, contemporary UI with smooth interactions and real-time updates using mock data.

## Use cases
- **Create and View Posts**
  1) User views a clean, modern feed interface
  2) User creates a new post with text and/or media files
  3) Post appears in the feed with user avatar, timestamp, and content
  4) User can scroll through multiple posts

- **React to Posts**
  1) User views reaction buttons (like, love, haha) on each post
  2) User clicks a reaction button
  3) Reaction count updates immediately with smooth animation
  4) Reactions display with emoji icons and counts

- **Comment on Posts**
  1) User clicks "Comments" button to view comment section
  2) User views existing comments with timestamps
  3) User types and submits a new comment
  4) Comment appears immediately in the list

## Plan
### Create and View Posts
1. [x] Create main feed layout with modern card-based design using Shadcn components
2. [x] Implement CreatePost component with Tailwind styling - card with avatar, textarea, and media upload button
3. [x] Add file upload with preview functionality for images and videos
4. [x] Style media preview with rounded corners, shadow, and remove button
5. [x] Implement post validation (text or media required)
6. [x] Create Post component with modern card design, subtle shadows, and hover effects
7. [x] Display user avatar, name, and relative timestamp (e.g., "2m ago")
8. [x] Render post text with proper typography and media with responsive sizing
9. [x] Generate mock data with 5-10 sample posts with different users

### React to Posts
1. [x] Add reaction buttons bar with emoji icons (👍 ❤️ 😂) and counts
2. [x] Style reaction buttons with hover effects and smooth transitions
3. [x] Implement reaction click handler with optimistic UI updates
4. [x] Add animation when reaction count increases
5. [x] Display total reaction counts with proper spacing

### Comment on Posts
1. [x] Create collapsible comments section with smooth expand/collapse animation
2. [x] Style individual comments with subtle background, rounded corners, and timestamps
3. [x] Add comment input field with modern styling (rounded, bordered, focus states
4. [x] Implement comment submission with Enter key support
5. [x] Display "No comments yet" empty state with subtle styling
6. [x] Show comment count badge on toggle button
7. [x] Add smooth transitions for showing/hiding comments
