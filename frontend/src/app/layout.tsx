import type { Metadata } from "next"; import "./style.css";
export const metadata: Metadata = {title:"Universal AI Platform",description:"Créez et déployez vos assistants IA"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}
