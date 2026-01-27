"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { FaQuoteLeft, FaStar } from "react-icons/fa";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = false,
  className,
}: {
  items: {
    quote: string;
    name: string;
    role: string;
    avatar?: string;
    rating?: number;
    stats?: string[];
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    addAnimation();
  }, []);
  const [start, setStart] = useState(false);
  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }
  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };
  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };
  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item, idx) => (
          <li
            className=" w-[350px] max-w-full shrink-0 rounded-2xl border border-zinc-200 bg-white  transition-all duration-300  px-6 py-6 md:w-[450px] dark:border-zinc-700 dark:bg-zinc-800 shadow-md hover:shadow-lg"
            key={item.name}
          >
            <blockquote className="flex flex-col h-full">
              {/* Company/Person Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {item.avatar && (
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-blue-50 dark:bg-blue-900">
                      <img
                        src={item.avatar || "/api/placeholder/40/40"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-sm text-neutral-900 dark:text-white">
                      {item.name}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-gray-400">
                      {item.role}
                    </p>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex gap-1">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <svg
                        key={i}
                        className={`h-4 w-4 ${
                          i < (item.rating || 5)
                            ? "text-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                </div>
              </div>

              {/* Quote */}
              <div className="relative z-20 text-sm leading-relaxed font-normal text-neutral-700 dark:text-gray-300 mb-4 flex-grow">
                {item.quote}
              </div>

              {/* Stats Section */}
              {item.stats && item.stats.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4 pt-2 border-t border-zinc-100 dark:border-zinc-700">
                  {item.stats.map((stat, index) => (
                    <div key={index} className="flex flex-col items-center p-1">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {stat}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};
