import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

const QRView = ({ value, size = 240 }) => {
  if (!value) {
    return (
      <div className="barcode-box" style={{ minHeight: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        No QR data
      </div>
    )
  }

  return (
    <div className="barcode-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        includeMargin={true}
        bgColor="#FFFFFF"
        fgColor="#000000"
        renderAs="svg"
      />
    </div>
  )
}

export default QRView