import { Roboto_Flex } from 'next/font/google';

export const robotoFlex = Roboto_Flex({ subsets: ['latin'] });

// Alias: los componentes que todavía importan `inter` y `lusitana` siguen
// funcionando, pero ahora renderizan Roboto Flex. (Se pueden renombrar a
// `robotoFlex` más adelante para que quede del todo prolijo.)
export const inter = robotoFlex;
export const lusitana = robotoFlex;