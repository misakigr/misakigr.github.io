import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

const BarcodeView = ({ value, type = 'CODE128', width = 300, height = 120 }) => {
  const canvasRef = useRef(null)
  const svgRef = useRef(null)

  useEffect(() => {
    if (!value) return

    try {
      let element = canvasRef.current

      // Try SVG first for better quality
      if (type !== 'CODE128' && type !== 'EAN13' && type !== 'CODE39' && type !== 'UPC') {
        element = canvasRef.current
      }

      const options = {
        format: type,
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
        textMargin: 2,
        margin: 10,
        flat: true,
        background: '#ffffff',
        lineColor: '#000000',
        text: value,
      }

      // Use SVG container if available
      if (svgRef.current) {
        JsBarcode(svgRef.current, value, options)
      } else if (element) {
        JsBarcode(element, value, options)
      }
    } catch (error) {
      console.error('Barcode generation error:', error)
    }
  }, [value, type])

  if (!value) {
    return (
      <div className="barcode-box" style={{ minHeight: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        No barcode data
      </div>
    )
  }

  return (
    <div className="barcode-box">
      <svg
        ref={svgRef}
        style={{ maxWidth: '100%', height: 'auto' }}
        preserveAspectRatio="xMidYMid meet"
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none', maxWidth: '100%', height: 'auto' }}
      />
    </div>
  )
}

export default BarcodeView