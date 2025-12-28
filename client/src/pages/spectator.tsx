import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockMoments } from "@/lib/mockData";
import { Play, Pause, SkipForward, SkipBack, Share2, Download, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import generatedVideo from '@assets/generated_videos/cinematic_interface_showing_scrolling_quantum_logs_and_data_streams.mp4';

export default function SpectatorView() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState([30]);

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight">Spectator View</h1>
          <p className="text-muted-foreground mt-1">Replay and analyze critical system events.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" /> Share Clip
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Main Video Player */}
        <Card className="lg:col-span-2 bg-black border-primary/20 flex flex-col overflow-hidden relative group">
          <div className="flex-1 relative bg-black/90 flex items-center justify-center">
            {/* Video Element */}
            <video 
              src={generatedVideo} 
              className="w-full h-full object-cover opacity-80"
              autoPlay={true}
              loop={true}
              muted={true}
              playsInline={true}
            />
            
            {/* Overlay UI */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1 rounded border border-white/10">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-red-500 font-bold">LIVE REPLAY</span>
            </div>
            
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1 rounded border border-white/10">
              <span className="text-xs font-mono text-primary">CAM-01 [EDGE-NODE-992]</span>
            </div>

            {/* Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="space-y-4">
                <Slider 
                  value={currentTime} 
                  onValueChange={setCurrentTime} 
                  max={100} 
                  step={1}
                  className="[&_.range]:bg-primary"
                />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:text-primary hover:bg-white/10"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
                      <SkipBack className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
                      <SkipForward className="w-5 h-5" />
                    </Button>
                    <span className="font-mono text-sm text-white/70 ml-2">00:12:45 / 00:45:00</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <div className="bg-white/10 px-2 py-1 rounded text-xs font-mono text-white/70">1080p 60fps</div>
                     <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
                       <Maximize2 className="w-5 h-5" />
                     </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Moments Timeline */}
        <Card className="bg-card border-border flex flex-col h-full overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Log Moments</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="divide-y divide-border">
              {mockMoments.map((moment) => (
                <div 
                  key={moment.id} 
                  className="p-4 hover:bg-muted/30 cursor-pointer transition-colors group relative"
                >
                  <div className="flex gap-4">
                    <div className={`w-24 h-16 rounded border border-white/10 ${moment.thumbnail} flex-shrink-0 relative overflow-hidden`}>
                       <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Play className="w-6 h-6 text-white drop-shadow-md" />
                       </div>
                       <div className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[9px] font-mono text-white">
                         {moment.duration}
                       </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-sm truncate pr-2 group-hover:text-primary transition-colors">{moment.title}</h4>
                        <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                          {moment.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                         <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                           moment.type === 'alert' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                           moment.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                           'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                         }`}>
                           {moment.type}
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Placeholder items to fill space */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={`p-${i}`} className="p-4 opacity-40 hover:opacity-60 cursor-not-allowed">
                  <div className="flex gap-4">
                    <div className="w-24 h-16 rounded bg-secondary/30 border border-white/5" />
                    <div className="flex-1 space-y-2">
                       <div className="h-4 w-3/4 bg-secondary/30 rounded" />
                       <div className="h-3 w-1/4 bg-secondary/30 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
