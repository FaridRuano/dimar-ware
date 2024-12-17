'use client'
import Image from 'next/image'
import React from 'react'
import BtnView from '@public/assets/icons/btn-view.webp'
import BtnDownload from '@public/assets/icons/btn-download.webp'

 
const page = () => {

  /* Current Date */

  const getCurrentDate = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    return `${day}/${month}/${year}`
  };

  return (
    <>
      <div className='pagename'>
        <span>
          Inicio
        </span>
      </div>
      <div className="workspace">
        <div className="container-row">
          <div className="container-col w2">
            <div className="container">
              <div className="title-container">
                <span>Bienvenido a <b>Facturación</b></span>
              </div>
            </div>
            <div className="container primary">
              <div className="row">
                <div className="title-container">
                  <span><b>Total de emisiones</b></span>
                </div>
                <div className="title-container">
                  <span><b>{getCurrentDate()}</b></span>
                </div>
              </div>
              <div className="footer-container">
                <span><b>45</b></span>
              </div>
            </div>
            <div className="container">
              <div className="title-container">
                <span>Últimas Transacciones</span>
              </div>
              <div className="datatable-container">
                <table>
                  <tbody>
                    <tr className='table-05'>
                      <td>
                        Farid Ruano
                      </td>
                      <td>
                        $<b>45.44</b>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="footer-a-end">
                <div className="btn-base black">
                  <button>Ver Todos</button>
                </div>
              </div>
            </div>
          </div>
          <div className="container w3">
            <div className="title-container">
              <span>Comprobantes emitidos <b>hoy</b></span>
            </div>
            <div className="datatable-container">
              <table>
                <tbody>
                  <tr className='table-05'>
                    <td>
                      Consumidor Final
                    </td>
                    <td>
                      <div className="btns-warp">
                        <div className="btn-row gray">
                          <Image src={BtnView} width={'auto'} height={12} alt='View'/>
                        </div>
                        <div className="btn-row">
                          <Image src={BtnDownload} width={'auto'} height={14} alt='Download'/>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className='table-05'>
                    <td>
                      Farid Ruano
                    </td>
                    <td>
                      <div className="btns-warp">
                        <div className="btn-row gray">
                          <Image src={BtnView} width={'auto'} height={12} alt='View'/>
                        </div>
                        <div className="btn-row">
                          <Image src={BtnDownload} width={'auto'} height={14} alt='Download'/>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="footer-a-end">
              <div className="btn-base black">
                <button>Ver Todos</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default page