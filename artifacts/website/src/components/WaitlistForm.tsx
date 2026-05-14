import { useState } from "react";
import { useJoinWaitlist } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [childAge, setChildAge] = useState("");
  const { toast } = useToast();
  
  const joinWaitlist = useJoinWaitlist();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    joinWaitlist.mutate(
      { data: { email, name, childAge } },
      {
        onSuccess: () => {
          toast({
            title: "You're on the list!",
            description: "We'll be in touch with updates on our launch.",
          });
          setEmail("");
          setName("");
          setChildAge("");
        },
        onError: () => {
          toast({
            title: "Something went wrong",
            description: "Please try again later.",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (joinWaitlist.isSuccess) {
    return (
      <div className="bg-primary/10 p-8 rounded-2xl text-center border border-primary/20">
        <h3 className="text-xl font-bold text-primary mb-2">Thank you!</h3>
        <p className="text-muted-foreground">You have been added to the waitlist. We will notify you when the Vital Patch is available.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-xl shadow-black/5 border border-border">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold tracking-tight mb-2">Get early access</h3>
        <p className="text-muted-foreground text-sm">Join the waitlist to be the first to know when we launch.</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email address <span className="text-destructive">*</span></Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="you@example.com" 
          required 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">Your name (optional)</Label>
        <Input 
          id="name" 
          type="text" 
          placeholder="Jane Doe" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="childAge">Child's age (optional)</Label>
        <Input 
          id="childAge" 
          type="text" 
          placeholder="e.g. 5" 
          value={childAge}
          onChange={(e) => setChildAge(e.target.value)}
          className="h-12"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full h-12 text-base mt-2 rounded-xl"
        disabled={joinWaitlist.isPending}
      >
        {joinWaitlist.isPending ? "Joining..." : "Join the Waitlist"}
      </Button>
    </form>
  );
}
