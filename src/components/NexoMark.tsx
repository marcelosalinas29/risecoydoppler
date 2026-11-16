import darkSymbol from '@/assets/nexo-symbol-dark.png';
import lightSymbol from '@/assets/nexo-symbol-light.png';
import darkLogo from '@/assets/nexo-logo-dark.png';

interface NexoMarkProps {
  className?: string;
  variant?: 'silver' | 'color';
  fullLogo?: boolean;
}

const NexoMark = ({ className, variant = 'silver', fullLogo = false }: NexoMarkProps) => (
  <img
    src={fullLogo ? darkLogo : variant === 'silver' ? darkSymbol : lightSymbol}
    alt={fullLogo ? 'Nexo Imagen — Consulta integral en diagnóstico por imágenes' : ''}
    aria-hidden={fullLogo ? undefined : true}
    className={`object-contain ${fullLogo ? '' : 'nexo-mark-small rounded-2xl overflow-hidden'} ${className || ''}`}
    decoding="async"
    draggable={false}
  />
);

export default NexoMark;
