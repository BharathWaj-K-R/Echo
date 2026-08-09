# Echo Journal

================================================================================
LOVABLE FRONTEND PROMPT: Echo Voice Journal UI
Clean White Theme | Interactive | User-Friendly | Compact Layout
================================================================================

PROJECT: Echo — Voice Journal + Mood Recall
Frontend Framework: Next.js + TypeScript
Styling: Tailwind CSS (light theme only, no dark mode)
State Management: React Hooks (useState, useContext)
Charts: Recharts (mood trend visualization)
Icons: Lucide React
UI Components: Shadcn/ui (Button, Card, Dialog, Input, Select)

DESIGN GOALS:
- Clean, minimal white background (#FFFFFF)
- Compact layout (no wasted space)
- Interactive elements (hover, animations, transitions)
- User-friendly (clear labeling, intuitive navigation)
- Mobile-responsive (works on phone + desktop)
- Light theme ONLY (no dark mode)

================================================================================
1. COLOR PALETTE (White Theme)
================================================================================

Primary: #3B82F6 (Indigo Blue)
Accent: #F97316 (Warm Orange)
Success: #10B981 (Green)
Warning: #F59E0B (Amber)
Danger: #EF4444 (Red)
Background: #FFFFFF (Pure White)
Text Primary: #1F2937 (Dark Gray)
Text Secondary: #6B7280 (Medium Gray)
Border: #E5E7EB (Light Gray)
Hover: #F3F4F6 (Very Light Gray)

================================================================================
2. PAGE STRUCTURE
================================================================================

Layout (shared):
- Compact header (Echo logo + navigation)
- Main content (centered, max-width 1200px)
- Footer (compact, minimal)

Pages:
1. / (Dashboard/Timeline)
2. /record (Record voice entry)
3. /entry/[id] (Entry detail + echoes)
4. /settings (optional, minimal)

Navigation:
- Top navigation bar (logo + links)
- Bottom mobile nav (record, timeline, settings)

================================================================================
3. HEADER COMPONENT (Compact)
================================================================================

Header:
- Logo: "Echo" (left, bold, 24px)
- Navigation links: Home, Record, Settings (right, small)
- Height: 60px (compact)
- Sticky top
- Light shadow on scroll

```tsx
// components/Header.tsx
import Link from "next/link";
import { Mic } from "lucide-react";

export default function Header() {
  return (
    


      


        
          
          Echo
        
        
          Home
          Record
          Settings
        
      


    


  );
}
```

================================================================================
4. PAGE: / (Timeline/Dashboard)
================================================================================

Layout:
- Quick stats row (total entries, avg mood, today's mood)
- Mood trend chart (last 7 days)
- Recent entries list (compact cards, horizontal scroll or grid)
- Call-to-action: "Record new entry" (floating button)

Features:
- Chart shows mood line trend
- Cards show: date, mood score, 1-2 mood tags, snippet of transcript
- Click card → go to /entry/[id]
- Filter: All, Last 7 days, Last 30 days
- Search: quick search by mood tag or date

```tsx
// pages/index.tsx
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Mic, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetch("/api/entries")
      .then(r => r.json())
      .then(data => {
        setEntries(data);
        // aggregate for chart (mood per day)
        const grouped = {};
        data.forEach((e: any) => {
          const date = new Date(e.created_at).toLocaleDateString();
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(e.sentiment_score);
        });
        const chartData = Object.entries(grouped).map(([date, scores]: any) => ({
          date,
          mood: Math.round(scores.reduce((a: number, b: number) => a + b) / scores.length)
        }));
        setChartData(chartData);
      });
  }, []);

  const avgMood = entries.length > 0 ? Math.round(entries.reduce((a, b) => a + b.sentiment_score, 0) / entries.length) : 0;

  return (
    


      


        {/* Quick Stats */}
        


          


            

Total Entries


            

{entries.length}


          


          


            

Avg Mood


            

{avgMood}/100


          


          


            

Trend


            


              
              

+12%


            


          


        



        {/* Chart */}
        


          

7-Day Mood Trend


          
            
              
              
              
               `${value}/100`} />
              
            
          
        



        {/* Recent Entries */}
        


          

Recent Entries


          


            {entries.slice(0, 6).map((entry: any) => (
              
                
                  


                    

{new Date(entry.created_at).toLocaleDateString()}


                    {entry.sentiment_score}/100
                  


                  

{entry.transcript}


                  


                    {entry.mood_tags.slice(0, 2).map((tag: string) => (
                      
                        {tag}
                      
                    ))}
                  


                
              
            ))}
          


        



        {/* FAB: Record Button */}
        
          
            
          
        
      


    


  );
}
```

================================================================================
5. PAGE: /record (Voice Recording)
================================================================================

Layout:
- Centered recording UI
- Title: "Record Your Moment"
- Large record button (animated pulse when recording)
- Waveform visualization (animated bars, optional)
- Stop button (visible only when recording)
- Transcript display (after submission)
- Submit button (after recording stops)
- Status: "Queued...", "Processing...", "Done!"

Features:
- MediaRecorder API (browser native)
- Real-time waveform animation
- Audio playback (preview before submit)
- Confidence indicator (mic access, audio level)
- Keyboard shortcut: Space to start/stop
- Mobile-friendly (full screen on mobile)

```tsx
// pages/record.tsx
import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Send } from "lucide-react";

export default function Record() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, recording, processing, done
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setStatus("recording");
    } catch (err) {
      alert("Mic access denied");
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const submit = async () => {
    if (!audioBlob) return;
    setStatus("processing");

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64 })
      });
      if (res.ok) {
        setStatus("done");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    };
    reader.readAsDataURL(audioBlob);
  };

  return (
    


      


        

Record Your Moment


        

Share your thoughts and feelings



        {/* Recording UI */}
        


          {/* Large Record Button */}
          
            {recording ?  : }
          

          {/* Status Text */}
          


            {status === "idle" && "Click to start recording"}
            {status === "recording" && "🔴 Recording..."}
            {status === "processing" && "⏳ Processing..."}
            {status === "done" && "✅ Done! Redirecting..."}
          



          {/* Audio Playback (if available) */}
          {audioBlob && (
            


              

Preview


              
                
              
            


          )}

          {/* Submit Button */}
          {audioBlob && !recording && status === "idle" && (
            
              
              Submit Entry
            
          )}
        


      


    


  );
}
```

================================================================================
6. PAGE: /entry/[id] (Entry Detail + Echoes)
================================================================================

Layout (2 columns on desktop, stacked on mobile):
- Left: Entry transcript, mood score, mood tags, date/time, waveform
- Right: "Echoes" (similar entries, 3 items)

Features:
- Full transcript display
- Mood score (large, colored indicator)
- Mood tags (colored badges)
- Share button (copy link)
- Delete button (optional)
- Echoes: clickable cards that navigate to similar entries
- Connect animation (showing similarity connection)

```tsx
// pages/entry/[id].tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Heart, Trash, Share, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function EntryDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [entry, setEntry] = useState(null);
  const [echoes, setEchoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/entries/${id}`)
      .then(r => r.json())
      .then(e => setEntry(e));
    fetch(`/api/entries/${id}/similar`)
      .then(r => r.json())
      .then(e => setEchoes(e));
    setLoading(false);
  }, [id]);

  if (loading || !entry) return 

Loading...

;

  const moodColor = entry.sentiment_score > 70 ? "green" : entry.sentiment_score > 40 ? "yellow" : "red";

  return (
    


      


        
          ← Back
        

        


          {/* Entry Content */}
          


            


              


                


                  


                    {new Date(entry.created_at).toLocaleDateString()}
                  


                  

{new Date(entry.created_at).toLocaleTimeString()}


                


                


                  

{entry.sentiment_score}


                  

/ 100


                


              



              {/* Mood Tags */}
              


                {entry.mood_tags.map((tag: string) => (
                  
                    {tag}
                  
                ))}
              



              {/* Transcript */}
              

{entry.transcript}



              {/* Actions */}
              


                
                  
                  Share
                
                
                  
                  Delete
                
              


            


          



          {/* Echoes (Similar Entries) */}
          


            

Similar Moments


            {echoes.length === 0 ? (
              

No similar entries yet


            ) : (
              


                {echoes.map((echo: any) => (
                  
                    
                      

Similar moment


                      

{echo.transcript}


                      


                        {echo.sentiment_score}/100
                        
                      


                    
                  
                ))}
              


            )}
          


        


      


    


  );
}
```

================================================================================
7. TAILWIND CONFIG (Light Theme Only)
================================================================================

tailwind.config.js:

module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        accent: "#F97316",
      },
    },
  },
  plugins: [],
}

globals.css:

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #3B82F6;
  --accent: #F97316;
  --bg: #FFFFFF;
  --text: #1F2937;
  --border: #E5E7EB;
}

body {
  @apply bg-white text-gray-900 font-sans;
}

button {
  @apply transition duration-200;
}

a {
  @apply text-indigo-600 hover:text-indigo-700;
}

================================================================================
8. COMPONENTS (Reusable)
================================================================================

components/Button.tsx:
```tsx
interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
}

export default function Button({ variant = "primary", size = "md", children, onClick }: ButtonProps) {
  const baseStyle = "font-semibold rounded-lg transition";
  const variantStyle = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "border border-gray-300 text-gray-900 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }[variant];
  const sizeStyle = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }[size];

  return (
    
      {children}
    
  );
}
```

components/Card.tsx:
```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    


      {children}
    


  );
}
```

================================================================================
9. ANIMATIONS (Tailwind + CSS)
================================================================================

styles/animations.css:

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-pulse-glow {
  animation: pulse-glow 2s infinite;
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

================================================================================
10. RESPONSIVE DESIGN
================================================================================

Mobile (< 768px):
- Stack layout vertically
- Full-width buttons
- Smaller font sizes
- Bottom navigation bar
- FAB for record button

Tablet (768px - 1024px):
- 2-column layout (timeline)
- Compact cards

Desktop (> 1024px):
- 3-column layout (timeline)
- Full entry detail + echoes side-by-side

================================================================================
11. PACKAGE.JSON DEPENDENCIES
================================================================================

{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.292.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0"
  }
}

================================================================================
12. DEPLOYMENT CHECKLIST
================================================================================

Frontend:
✓ All pages build clean (npm run build)
✓ No TypeScript errors
✓ Light theme only (no dark mode code)
✓ Responsive on mobile + desktop
✓ Images optimized
✓ Font sizes readable (min 14px)
✓ Contrast passes WCAG AA
✓ No console errors
✓ API calls to /api/* routes (no hardcoded backend URL)

================================================================================
13. BUILD & EXPORT
================================================================================

next.config.js:

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
}

Build:
npm run build
npm run export  # generates .next/export folder

Output: /frontend/.next/export (static HTML + JS)

================================================================================

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8fc43037-a9bb-4a2f-870d-8d6f1bb9f53a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
