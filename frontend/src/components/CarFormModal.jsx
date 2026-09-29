import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Car, 
  Clock, 
  Image as ImageIcon, 
  Sparkles, 
  AlertCircle, 
  Calculator, 
  UploadCloud, 
  FolderOpen, 
  Link2, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const TARIFA_POR_HORA = 11.80; // Tarifa fixa de R$ 11,80 por hora

const PRESET_CARS = [
  {
    marca: 'Ford',
    modelo: 'Mustang Mach 1 V8',
    horas: 2,
    foto: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=800&q=80',
  },
  {
    marca: 'Audi',
    modelo: 'RS6 Avant Quattro',
    horas: 4,
    foto: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=800&q=80',
  },
  {
    marca: 'Volvo',
    modelo: 'XC90 Recharge Hybrid',
    horas: 6,
    foto: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
  },
];

export default function CarFormModal({ isOpen, onClose, onSubmit, carToEdit = null }) {
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    horas: '',
    foto: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  
  // Controle de upload de imagem
  const [photoSourceMode, setPhotoSourceMode] = useState('file'); // 'file' ou 'url'
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Sincroniza formulário com o veículo sendo editado ou limpa para novo cadastro
  useEffect(() => {
    if (isOpen) {
      if (carToEdit) {
        setFormData({
          marca: carToEdit.marca || '',
          modelo: carToEdit.modelo || '',
          horas: carToEdit.horas !== undefined ? String(carToEdit.horas) : '',
          foto: carToEdit.foto || '',
        });
        setSelectedFileName(carToEdit.foto?.startsWith('data:') ? 'Imagem do veículo' : '');
        setPhotoSourceMode(carToEdit.foto?.startsWith('data:') ? 'file' : (carToEdit.foto ? 'url' : 'file'));
      } else {
        setFormData({
          marca: '',
          modelo: '',
          horas: '',
          foto: '',
        });
        setSelectedFileName('');
        setPhotoSourceMode('file');
      }
      setFormErrors({});
      setServerError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [carToEdit, isOpen]);

  // Cálculo automático em tempo real: Horas * R$ 11,80
  const valorTotalCalculado = useMemo(() => {
    const horasNum = Number(formData.horas);
    if (isNaN(horasNum) || horasNum < 0) return 0;
    return Number((horasNum * TARIFA_POR_HORA).toFixed(2));
  }, [formData.horas]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Processa o arquivo selecionado e otimiza via Canvas para Base64 leve
   */
  const processImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormErrors((prev) => ({
        ...prev,
        foto: 'Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).',
      }));
      return;
    }

    // Limite de 15MB para o arquivo original
    if (file.size > 15 * 1024 * 1024) {
      setFormErrors((prev) => ({
        ...prev,
        foto: 'O arquivo selecionado é muito grande. Escolha uma imagem de até 15MB.',
      }));
      return;
    }

    setIsProcessingImage(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensiona inteligentemente para no máximo 1280px de largura/altura
        const maxDimension = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Converte para JPEG com qualidade 0.85 (altíssima fidelidade com ~100-200kb)
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setFormData((prev) => ({ ...prev, foto: optimizedDataUrl }));
        setSelectedFileName(file.name);
        setFormErrors((prev) => ({ ...prev, foto: '' }));
        setIsProcessingImage(false);
      };

      img.onerror = () => {
        setIsProcessingImage(false);
        setFormErrors((prev) => ({
          ...prev,
          foto: 'Não foi possível ler a imagem selecionada. Tente outro arquivo.',
        }));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      setIsProcessingImage(false);
      setFormErrors((prev) => ({
        ...prev,
        foto: 'Erro ao carregar o arquivo do explorador.',
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, foto: '' }));
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyPreset = (preset) => {
    setFormData({
      marca: preset.marca,
      modelo: preset.modelo,
      horas: preset.horas.toString(),
      foto: preset.foto,
    });
    setSelectedFileName('');
    setPhotoSourceMode('url');
    setFormErrors({});
  };

  const validate = () => {
    const errors = {};
    if (!formData.marca.trim()) errors.marca = 'A marca é obrigatória.';
    if (!formData.modelo.trim()) errors.modelo = 'O modelo é obrigatório.';
    if (!formData.horas || isNaN(Number(formData.horas)) || Number(formData.horas) <= 0) {
      errors.horas = 'Informe um tempo em horas válido (mínimo 1 hora).';
    }
    if (!formData.foto || !formData.foto.trim()) {
      errors.foto = 'Selecione uma foto do seu computador ou informe o link da imagem.';
    } else if (
      !formData.foto.startsWith('data:image/') &&
      !formData.foto.startsWith('http://') &&
      !formData.foto.startsWith('https://')
    ) {
      errors.foto = 'Formato de imagem inválido. Escolha um arquivo válido ou uma URL iniciando com http/https.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const horasNum = Number(formData.horas);
      const total = Number((horasNum * TARIFA_POR_HORA).toFixed(2));
      await onSubmit({
        marca: formData.marca.trim(),
        modelo: formData.modelo.trim(),
        horas: horasNum,
        valorTotal: total,
        preco: total,
        foto: formData.foto.trim(),
      });
      // Limpa formulário e fecha o modal
      setFormData({ marca: '', modelo: '', horas: '', foto: '' });
      setFormErrors({});
      onClose();
    } catch (err) {
      setServerError(err.message || (carToEdit ? 'Erro ao salvar alterações no veículo.' : 'Erro ao cadastrar veículo na garagem.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="modal-title" className="modal-title">
              {carToEdit ? 'Editar Veículo no Pátio' : 'Entrada de Veículo na Garagem'}
            </h2>
            <p className="modal-subtitle">
              {carToEdit 
                ? 'Atualize os dados e o tempo de permanência do veículo' 
                : 'Registre o veículo e o tempo previsto de permanência'}
            </p>
          </div>
          <button 
            type="button" 
            className="btn-icon-close" 
            onClick={onClose}
            aria-label="Fechar janela"
          >
            <X size={20} />
          </button>
        </div>

        {/* Presets Rápidos (apenas para novo cadastro) */}
        {!carToEdit && (
          <div className="presets-container">
            <span className="presets-label">
              <Sparkles size={14} /> Exemplos rápidos de entrada:
            </span>
            <div className="presets-buttons">
              {PRESET_CARS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn-preset"
                  onClick={() => handleApplyPreset(preset)}
                >
                  {preset.marca} {preset.modelo} ({preset.horas}h)
                </button>
              ))}
            </div>
          </div>
        )}

        {serverError && (
          <div className="alert-error">
            <AlertCircle size={18} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="car-form" noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="marca" className="form-label">
                Marca <span className="required">*</span>
              </label>
              <div className="input-with-icon">
                <Car size={16} className="input-icon" />
                <input
                  id="marca"
                  name="marca"
                  type="text"
                  placeholder="Ex: Toyota, BMW, Ford"
                  value={formData.marca}
                  onChange={handleChange}
                  className={`form-input ${formErrors.marca ? 'input-error' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.marca && <span className="field-error">{formErrors.marca}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="modelo" className="form-label">
                Modelo <span className="required">*</span>
              </label>
              <input
                id="modelo"
                name="modelo"
                type="text"
                placeholder="Ex: Corolla Altis, Mustang"
                value={formData.modelo}
                onChange={handleChange}
                className={`form-input ${formErrors.modelo ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
              {formErrors.modelo && <span className="field-error">{formErrors.modelo}</span>}
            </div>
          </div>

          {/* Campo: Tempo de Permanência (em horas) */}
          <div className="form-group">
            <label htmlFor="horas" className="form-label">
              Tempo de Permanência (em horas) <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <Clock size={16} className="input-icon" />
              <input
                id="horas"
                name="horas"
                type="number"
                min="1"
                step="1"
                placeholder="Ex: 3"
                value={formData.horas}
                onChange={handleChange}
                className={`form-input ${formErrors.horas ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {formErrors.horas && <span className="field-error">{formErrors.horas}</span>}
          </div>

          {/* Cálculo Automático em Tempo Real da Tarifa */}
          <div className="pricing-calculator-box">
            <div className="pricing-calc-header">
              <Calculator size={16} className="pricing-calc-icon" />
              <span className="pricing-calc-title">Cálculo de Tarifa do Estacionamento</span>
              <span className="pricing-rate-badge">R$ 11,80 / hora</span>
            </div>
            <div className="pricing-calc-body">
              <div className="pricing-formula">
                <span className="calc-hours">
                  {formData.horas ? `${formData.horas} hora${Number(formData.horas) > 1 ? 's' : ''}` : '0 horas'}
                </span>
                <span className="calc-operator">&times;</span>
                <span className="calc-rate">R$ 11,80</span>
                <span className="calc-equals">=</span>
                <span className="calc-result">
                  {formatCurrency(valorTotalCalculado)}
                </span>
              </div>
              <p className="pricing-note">
                O valor total é recalculado automaticamente com base na tarifa fixa da garagem (R$ 11,80/h).
              </p>
            </div>
          </div>

          <div className="form-group">
            <div className="photo-label-row">
              <label className="form-label">
                Foto do Veículo <span className="required">*</span>
              </label>
              <div className="photo-mode-toggle">
                <button
                  type="button"
                  className={`btn-mode-tab ${photoSourceMode === 'file' ? 'active' : ''}`}
                  onClick={() => setPhotoSourceMode('file')}
                  title="Carregar imagem do seu computador"
                >
                  <FolderOpen size={13} />
                  <span>Meu Computador</span>
                </button>
                <button
                  type="button"
                  className={`btn-mode-tab ${photoSourceMode === 'url' ? 'active' : ''}`}
                  onClick={() => setPhotoSourceMode('url')}
                  title="Usar link da internet"
                >
                  <Link2 size={13} />
                  <span>Link da Web</span>
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              id="car-file-input"
            />

            {photoSourceMode === 'file' ? (
              <>
                {formData.foto ? (
                  <div className="selected-photo-card">
                    <img
                      src={formData.foto}
                      alt="Prévia do veículo selecionado"
                      className="selected-photo-preview"
                    />
                    <div className="selected-photo-details">
                      <div className="selected-photo-status">
                        <CheckCircle2 size={16} className="status-icon-check" />
                        <span className="selected-photo-name" title={selectedFileName || 'Imagem carregada'}>
                          {selectedFileName || 'Foto pronta para salvar'}
                        </span>
                      </div>
                      <p className="selected-photo-hint">Imagem otimizada para o banco de dados</p>
                      <div className="selected-photo-actions">
                        <button
                          type="button"
                          className="btn-change-photo"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSubmitting || isProcessingImage}
                        >
                          <FolderOpen size={14} />
                          <span>Trocar Foto</span>
                        </button>
                        <button
                          type="button"
                          className="btn-remove-photo"
                          onClick={handleRemovePhoto}
                          disabled={isSubmitting}
                        >
                          <RotateCcw size={14} />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${isProcessingImage ? 'processing' : ''}`}
                    onClick={() => !isProcessingImage && fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    {isProcessingImage ? (
                      <div className="upload-processing">
                        <span className="spinner-small"></span>
                        <span>Otimizando imagem para o banco...</span>
                      </div>
                    ) : (
                      <>
                        <div className="upload-icon-circle">
                          <UploadCloud size={24} />
                        </div>
                        <div className="upload-text-group">
                          <span className="upload-main-text">
                            Clique para escolher do seu computador
                          </span>
                          <span className="upload-sub-text">
                            ou arraste e solte o arquivo aqui
                          </span>
                        </div>
                        <span className="upload-formats-hint">
                          PNG, JPG, JPEG ou WEBP (até 15MB)
                        </span>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="input-with-icon">
                <Link2 size={16} className="input-icon" />
                <input
                  id="foto"
                  name="foto"
                  type="url"
                  placeholder="https://exemplo.com/foto-do-carro.jpg"
                  value={formData.foto}
                  onChange={handleChange}
                  className={`form-input ${formErrors.foto ? 'input-error' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {formErrors.foto && <span className="field-error">{formErrors.foto}</span>}

            {/* Pré-visualização quando em modo Link Web */}
            {photoSourceMode === 'url' && formData.foto && (
              <div className="image-preview-container">
                <span className="preview-label">Pré-visualização do Link:</span>
                <img
                  src={formData.foto}
                  alt="Prévia do veículo"
                  className="image-preview"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                  onLoad={(e) => {
                    e.target.style.display = 'block';
                  }}
                />
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              id="btn-submit-car"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small"></span>
                  <span>{carToEdit ? 'Salvando...' : 'Registrando...'}</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>
                    {carToEdit
                      ? `Salvar Alterações (${formatCurrency(valorTotalCalculado)})`
                      : `Registrar Entrada (${formatCurrency(valorTotalCalculado)})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
