"use client";
import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
const links = [["Home", "#home"], ["Features", "#features"], ["Paket", "#pricing"], ["Templates", "#templates"], ["Resources", "#resources"]];
export function Brand() { return <BrandLogo />; }
export function Navigation() {
 const [open,setOpen]=useState(false);
 return <header className="er-nav er-container"><Link href="/" aria-label="Pocket Planner home"><Brand /></Link><nav aria-label="Main navigation" className="er-desktop-nav">{links.map(([label,url])=><a key={label} href={url}>{label}</a>)}</nav><div className="er-nav-actions"><Link className="er-login" href="/login">Log In</Link><button className="er-menu-button" aria-label={open?"Close menu":"Open menu"} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div>{open&&<nav id="mobile-navigation" className="er-mobile-nav" aria-label="Mobile navigation">{links.map(([label,url])=><a key={label} href={url} onClick={()=>setOpen(false)}>{label}</a>)}<Link href="/login">Log In</Link></nav>}</header>;
}
