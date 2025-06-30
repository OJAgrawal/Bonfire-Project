# Bonfire 🔥

What To Do: 
1: Write npm install in the terminal
2: Write npx next dev in the terminal
3: Ctrl+click the local host url
4:You should be good to go

## About the Project

Bonfire is a social event platform that empowers anyone to host or join real-world gatherings — no followers, no clout required. Whether it’s a rooftop jam, a chai meetup, or a quick coding session, Bonfire lets people connect through moments, not metrics.

## 🌱 Inspiration

We noticed a growing contradiction: People are more "connected" than ever, yet real-world interaction is declining. Existing social apps are built around followers, filters, and algorithms — making spontaneous, low-pressure events feel unreachable unless you're already popular.

We wanted to flip the narrative.

What if anyone could host something?
What if finding your vibe didn't depend on how many followers you have?

That's when Bonfire was born — a cozy, minimalist app to spark real human connections around shared experiences.

## 🧠 What We Learned

- How to integrate Supabase for real-time backend operations (auth, events, RSVP)
- How to use Google Maps API for interactive location-based event discovery
- How to design and build cross-platform UI with React Native + Expo
- Optimizing real-time UI updates and working with location data efficiently

## 🛠️ How We Built It

### Frontend:

- Built using React Native with Expo Router
- Screens include: Event feed, create event, map view, user RSVP tracking

### Backend:

- Supabase used for user auth, database storage, and real-time updates
- Database tables include users, events, rsvps

### Maps:

- Integrated Google Maps API to display events around users dynamically

### Design:

- Used bonfire-inspired colors: orange, warm yellow, soft darks
- Minimal UI for fast usability and cozy vibes

## 🚧 Challenges We Faced

- Handling Google Maps permissions and live location updates across Android/iOS
- Dynamically rendering events based on current map view bounds
- Making private events secure but shareable (invite-only mode)
- Ensuring real-time RSVP updates synced correctly across sessions

## 🌟 What Makes It Special

- Anyone can host — not just influencers or clubs
- No likes, no comments, no pressure — just show up and connect
- Instant RSVP and clean discoverability via the map and filters
- Built for college students, communities, and spontaneous fun

## 🔥 Try it Out

- [GitHub Repository](https://github.com/OjAgrawal/Bonfire-Project/)
- Video Demo
- Live Preview

Bonfire — Your vibe. Your tribe. Your time.
