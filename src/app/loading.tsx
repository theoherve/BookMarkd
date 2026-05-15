const RootLoading = () => {
  return (
    <div className="space-y-6">
      <div className="h-10 w-2/3 animate-pulse rounded-md bg-muted" />
      <div className="h-6 w-1/2 animate-pulse rounded-md bg-muted/70" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-40 animate-pulse rounded-xl bg-muted/60" />
        <div className="h-40 animate-pulse rounded-xl bg-muted/60" />
        <div className="h-40 animate-pulse rounded-xl bg-muted/60" />
      </div>
    </div>
  );
};

export default RootLoading;
