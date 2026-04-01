"use client";

import { type ComponentProps } from "react";
import NextImage from "next/image";
import { ImageMdx as CoreImageMdx, type ImageMdxProps as CoreImageMdxProps } from "../../components/ImageMdx";

export type ImageMdxProps = Omit<CoreImageMdxProps, "src"> & {
    src?: ComponentProps<typeof NextImage>["src"];
};

export function ImageMdx(props: ImageMdxProps) {
    return <CoreImageMdx ImageComponent={NextImage} {...props} />;
}
