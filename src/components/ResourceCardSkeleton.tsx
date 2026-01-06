// src/components/ResourceCardSkeleton.tsx
// Modern skeleton loading for ResourceCard - mimics actual card structure

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ResourceCardSkeleton = () => {
    return (
        <Card className="p-4">
            <div className="flex gap-4">
                {/* Thumbnail skeleton */}
                <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-lg shrink-0" />

                {/* Content skeleton */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* Title and badge */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-5 w-14 rounded-full" />
                            </div>
                        </div>
                        <Skeleton className="h-5 w-12 rounded-full shrink-0" />
                    </div>

                    {/* Subject/Chapter */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-2" />
                        <Skeleton className="h-3 w-20" />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-28 rounded-lg" />
                        <Skeleton className="h-10 w-10 rounded-md" />
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ResourceCardSkeleton;
