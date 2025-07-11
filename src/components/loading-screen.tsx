import GrafitoLogo from './grafito-logo';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="relative flex flex-col items-center">
        <GrafitoLogo className="h-40 w-40" />
        <p className="mt-86 text-2xl font-bold tracking-wide text-center">
          Welcome to Grafito Grafting Machine<br />
          Preparing your robotic grafting experience...
        </p>
      </div>
    </div>
  );
}