import * as React from 'react'
import style from '../styles/icon.module.css'

interface Props {
  d: string
  size: number
  label?: string
  style: React.CSSProperties
}

const Icon: React.FC<Props> = ({ d, size = '1em', label, style: styles }) => {
  return (
    <span className={style.root} style={styles} role={label ? 'figure' : undefined}>
      <svg
        version="1.1"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={d} className={style.icon} />
      </svg>
      {label && <span className={style.label}>{label}</span>}
    </span>
  )
}

export default Icon
