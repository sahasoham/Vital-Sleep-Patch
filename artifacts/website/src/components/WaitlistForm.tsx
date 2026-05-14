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
      <div className="bg-primary/10 p-8 rounded-2xl text-center border border-primary/20">
        <h3 className="text-xl font-bold text-primary mb-2">Thank you!</h3>
        <p className="text-muted-foreground">You've been added to the waitlist. We'll notify you when the Vital Patch is available.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-xl shadow-black/5 border border-border"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold tracking-tight mb-2">Get early access</h3>
        <p className="text-muted-foreground text-sm">Join the waitlist to be the first to know when we launch.</p>
      </div>

      <div className="space-y-2">
        <Label>Who needs the test?</Label>
        <div className="grid grid-cols-2 gap-2" data-testid="toggle-for-whom">
          <button
            type="button"
            onClick={() => setForWhom("child")}
            data-testid="toggle-for-child"
            className={`h-11 rounded-xl border text-sm font-medium transition-all ${
              forWhom === "child"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-white text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            For my child
          </button>
          <button
            type="button"
            onClick={() => setForWhom("myself")}
            data-testid="toggle-for-myself"
            className={`h-11 rounded-xl border text-sm font-medium transition-all ${
              forWhom === "myself"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-white text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            For myself
          </button>
        </div>
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
          data-testid="input-email"
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
          data-testid="input-name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">
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
          className="h-12"
          data-testid="input-age"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base mt-2 rounded-xl"
        disabled={joinWaitlist.isPending}
        data-testid="button-submit"
      >
        {joinWaitlist.isPending ? "Joining..." : "Join the Waitlist"}
      </Button>
    </form>
  );
}
