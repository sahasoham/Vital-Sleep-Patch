import { useState } from "react";
import { useJoinWaitlist } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type ForWhom = "child" | "myself";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [forWhom, setForWhom] = useState<ForWhom>("child");
  const [age, setAge] = useState("");
  const { toast } = useToast();

  const joinWaitlist = useJoinWaitlist();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    joinWaitlist.mutate(
      { data: { email, name: name || null, childAge: age || null } },
      {
        onSuccess: () => {
          toast({
            title: "You're on the list!",
            description: "We'll be in touch with updates on our launch.",
          });
          setEmail("");
          setName("");
          setAge("");
          setForWhom("child");
        },
        onError: (err: unknown) => {
          const status = (err as { status?: number })?.status;
          toast({
            title: status === 409 ? "Already on the list" : "Something went wrong",
            description: status === 409
              ? "This email is already on our waitlist."
              : "Please try again later.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (joinWaitlist.isSuccess) {
    return (
      <div className="bg-secondary p-10 rounded-[2rem] text-center border border-border/50 max-w-md w-full">
        <h3 className="text-2xl font-serif text-foreground mb-4">Thank you.</h3>
        <p className="text-muted-foreground font-light leading-relaxed">Your invitation has been requested. We'll notify you the moment the Vital Patch becomes available.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-md w-full bg-background p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-foreground/5 border border-border/50"
    >
      <div className="text-center mb-8">
        <h3 className="text-3xl font-serif tracking-tight mb-3 text-foreground">Request Access</h3>
        <p className="text-muted-foreground text-sm font-light">Join the priority list to be notified when we launch in your area.</p>
      </div>

      <div className="space-y-3">
        <Label className="text-foreground/80 font-medium">Who needs the test?</Label>
        <div className="grid grid-cols-2 gap-3" data-testid="toggle-for-whom">
          <button
            type="button"
            onClick={() => setForWhom("child")}
            data-testid="toggle-for-child"
            className={`h-12 rounded-xl border text-sm font-medium transition-all ${
              forWhom === "child"
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-background text-muted-foreground border-border hover:border-foreground/30"
            }`}
          >
            For my child
          </button>
          <button
            type="button"
            onClick={() => setForWhom("myself")}
            data-testid="toggle-for-myself"
            className={`h-12 rounded-xl border text-sm font-medium transition-all ${
              forWhom === "myself"
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-background text-muted-foreground border-border hover:border-foreground/30"
            }`}
          >
            For myself
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="email" className="text-foreground/80 font-medium">Email address <span className="text-destructive">*</span></Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-foreground transition-shadow rounded-xl px-4 font-light"
          data-testid="input-email"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="name" className="text-foreground/80 font-medium">Your name (optional)</Label>
        <Input
          id="name"
          type="text"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-foreground transition-shadow rounded-xl px-4 font-light"
          data-testid="input-name"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="age" className="text-foreground/80 font-medium">
          {forWhom === "child" ? "Child's age (optional)" : "Your age (optional)"}
        </Label>
        <Input
          id="age"
          type="number"
          min={1}
          max={25}
          placeholder={forWhom === "child" ? "e.g. 7" : "e.g. 16"}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="h-12 bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-foreground transition-shadow rounded-xl px-4 font-light"
          data-testid="input-age"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-14 text-base mt-4 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-md"
        disabled={joinWaitlist.isPending}
        data-testid="button-submit"
      >
        {joinWaitlist.isPending ? "Requesting..." : "Request Invitation"}
      </Button>
    </form>
  );
}
