// utils/metadata.ts
import { Metadata } from "next";

const APP_NAME = "SBG EGG Farms";
const APP_DESCRIPTION = "Connect with fellow farmers and share your poultry farming journey.";
const APP_LOGO = "/images/logos/sbg.png";
const APP_FAVICON = "/favicon.ico";

export const generateMetadata = (
  title: string = APP_NAME,
  description: string = APP_DESCRIPTION,
  image: string = APP_LOGO
): Metadata => ({
  title,
  description,
  openGraph: {
    title,
    description,
    type: "article",
    images: [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: "Post Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [image],
  },
  icons: {
    icon: APP_FAVICON,
  },
});
