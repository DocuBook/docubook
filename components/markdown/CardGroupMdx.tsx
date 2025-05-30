import React, { ReactNode } from "react";
import clsx from "clsx";

interface CardGroupProps {
  children: ReactNode;
  cols?: number;
  className?: string;
}

const CardGroup: React.FC<CardGroupProps> = ({ children, cols = 2, className }) => {
  const cardsArray = React.Children.toArray(children); // Pastikan children berupa array

  return (
    <div
      className={clsx(
        "grid gap-4 text-foreground",
        `grid-cols-1 sm:grid-cols-${cols}`,
        className
      )}
    >
      {cardsArray.map((card, index) => (
        <div key={index}>{card}</div>
      ))}
    </div>
  );
};

export default CardGroup;
