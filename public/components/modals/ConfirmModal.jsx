import React from 'react'

const ConfirmModal = ({active, handleModal, msg, handleResponse}) => {
  return (
    <div className={`overlay-modal ${active ? 'show':'hide'}`}>
        <div className="container">
            <div className="title-container">
                <span>Estas seguro de <b>{msg}?</b></span>
            </div>
            <div className="btns-container">
                <div className="btn-base-div gray" onClick={()=>handleModal()}>
                    <div className="btn-name">
                        Cancelar
                    </div>
                </div>
                <div className="btn-base-div" onClick={()=>handleResponse()}>
                    <div className="btn-name">
                        Aceptar
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default ConfirmModal