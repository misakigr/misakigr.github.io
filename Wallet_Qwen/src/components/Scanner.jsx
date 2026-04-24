import React, { useState, useEffect, useRef } from 'react'

const Scanner = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState(null)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const scannerRef = useRef(null)
  const codeScannerRef = useRef(null)

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })

      if (scannerRef.current && !codeScannerRef.current) {
        const { Html5Qrcode } = window
        if (Html5Qrcode) {
          codeScannerRef.current = new Html5Qrcode('scannerRegion')
          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          }

          try {
            await codeScannerRef.current.start(
              { facingMode: 'environment' },
              config,
              (decodedText) => {
                if (decodedText) {
                  onScan(decodedText)
                  stopScanner()
                }
              },
              (errorMessage) => {
                // Silent - no code detected
              }
            )
            setIsScanning(true)
          } catch (err) {
            console.error('Scanner start error:', err)
            setError('Не удалось запустить сканер. Попробуйте другой браузер или разрешите доступ к камере.')
            codeScannerRef.current = null
          }
        } else {
          setError('Библиотека html5-qrcode недоступна')
        }
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Нет доступа к камере. Разрешите доступ в настройках браузера.')
    }
  }

  const stopScanner = async () => {
    if (codeScannerRef.current) {
      try {
        await codeScannerRef.current.stop()
      } catch (e) {
        // Ignore
      }
      codeScannerRef.current = null
    }
    setIsScanning(false)
    onClose()
  }

  return (
    <div className="scanner-container">
      <div className="scanner-frame">
        <div id="scannerRegion" style={{ width: '100%', height: '100%' }}></div>
      </div>
      {error && <div style={{ color: '#ff5959', marginTop: '12px', fontSize: '14px' }}>{error}</div>}
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        {!isScanning ? (
          <button type="button" className="submit-btn" onClick={startScanner}>
            Запустить камеру
          </button>
        ) : (
          <button type="button" className="danger-btn" onClick={stopScanner}>
            Остановить
          </button>
        )}
        <button type="button" className="secondary-btn" onClick={onClose}>
          Отмена
        </button>
      </div>
    </div>
  )
}

export default Scanner