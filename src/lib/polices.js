// lib/polices.js : polices des écrans au design dogtorso (caisse, gestion, accueil).
// Classes à poser sur un conteneur : `${geist.variable} ${geistMono.variable}`.
import { Geist, Geist_Mono } from "next/font/google";

export const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
