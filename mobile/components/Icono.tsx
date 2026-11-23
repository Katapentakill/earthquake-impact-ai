import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';

export type NombreIcono = ComponentProps<typeof MaterialIcons>['name'];

/** Un solo juego de íconos (Material) en todas las plataformas, para que la app se vea igual en web, Android y iOS. */
export function Icono({ nombre, tam = 22, color }: { nombre: NombreIcono; tam?: number; color: string }) {
  return <MaterialIcons name={nombre} size={tam} color={color} accessible={false} />;
}
