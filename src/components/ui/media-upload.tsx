"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileVideo, ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { imagekit, isValidFileType, getFileCategory, formatFileSize, MAX_FILE_SIZE } from "@/lib/imagekit";

interface MediaUploadProps {
    value?: string; // URL del archivo actual
    onChange: (url: string) => void;
    onClear?: () => void;
    disabled?: boolean;
    className?: string;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function MediaUpload({
    value,
    onChange,
    onClear,
    disabled = false,
    className,
}: MediaUploadProps) {
    const [status, setStatus] = useState<UploadStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [previewInfo, setPreviewInfo] = useState<{ type: "image" | "video"; name: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Obtener parámetros de autenticación del servidor
    const getAuthParams = async () => {
        const response = await fetch("/api/imagekit-auth");
        if (!response.ok) {
            throw new Error("Error al obtener credenciales de subida");
        }
        return response.json();
    };

    // Manejar la subida del archivo
    const handleUpload = useCallback(async (file: File) => {
        // Validar tipo de archivo
        if (!isValidFileType(file)) {
            setError("Tipo de archivo no permitido. Use imágenes (JPG, PNG, GIF, WebP) o videos (MP4, WebM, MOV)");
            setStatus("error");
            return;
        }

        // Validar tamaño
        if (file.size > MAX_FILE_SIZE) {
            setError(`El archivo excede el tamaño máximo de ${formatFileSize(MAX_FILE_SIZE)}`);
            setStatus("error");
            return;
        }

        setStatus("uploading");
        setProgress(0);
        setError(null);

        try {
            // Obtener parámetros de autenticación
            const authParams = await getAuthParams();

            // Generar nombre único para el archivo
            const timestamp = Date.now();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            const fileName = `exercises/${timestamp}_${sanitizedName}`;

            // Subir a ImageKit usando el SDK
            const result = await imagekit.upload({
                file: file,
                fileName: fileName,
                ...authParams,
                onProgress: (event: { loaded: number; total: number }) => {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setProgress(percent);
                },
            });

            // Guardar la URL resultante
            const category = getFileCategory(file);
            setPreviewInfo({ type: category || "image", name: file.name });
            onChange(result.url || "");
            setStatus("success");
            setProgress(100);
        } catch (err) {
            console.error("Error subiendo archivo:", err);
            setError("Error al subir el archivo. Intenta de nuevo.");
            setStatus("error");
        }
    }, [onChange]);

    // Manejar selección de archivo
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    // Manejar arrastrar y soltar
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    // Limpiar archivo
    const handleClear = () => {
        setStatus("idle");
        setProgress(0);
        setError(null);
        setPreviewInfo(null);
        onClear?.();
        onChange("");
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    // Determinar el tipo de contenido actual para mostrar vista previa
    const currentMediaType = previewInfo?.type || (value ? (value.match(/\.(mp4|webm|mov|m4v)$/i) ? "video" : "image") : null);

    return (
        <div className={cn("space-y-3", className)}>
            {/* Zona de Drop / Estado actual */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer group",
                    "bg-neutral-900/30 hover:bg-neutral-900/50",
                    dragActive && "border-red-600 bg-red-600/10",
                    status === "error" && "border-red-500 bg-red-500/10",
                    status === "success" && "border-green-600 bg-green-600/5",
                    status === "idle" && "border-neutral-700 hover:border-red-600/50",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && status !== "uploading" && inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    disabled={disabled || status === "uploading"}
                    className="hidden"
                />

                {/* Estado: Idle (sin archivo) */}
                {status === "idle" && !value && (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-neutral-800 flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
                            <Upload className="h-7 w-7 text-neutral-400 group-hover:text-red-500 transition-colors" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-neutral-300">
                                Arrastra un archivo o haz clic para seleccionar
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                                Imágenes (JPG, PNG, GIF, WebP) o Videos (MP4, WebM, MOV) hasta 50MB
                            </p>
                        </div>
                    </div>
                )}

                {/* Estado: Subiendo */}
                {status === "uploading" && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-red-600/20 flex items-center justify-center">
                            <Loader2 className="h-7 w-7 text-red-500 animate-spin" />
                        </div>
                        <div className="w-full max-w-xs">
                            <div className="flex justify-between text-xs text-neutral-400 mb-2">
                                <span>Subiendo...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-linear-to-r from-red-600 to-red-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Estado: Éxito / Archivo cargado */}
                {(status === "success" || value) && status !== "uploading" && (
                    <div className="flex items-center gap-4">
                        {/* Preview del archivo */}
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-neutral-800 shrink-0">
                            {currentMediaType === "video" ? (
                                <div className="h-full w-full flex items-center justify-center">
                                    <FileVideo className="h-8 w-8 text-red-500" />
                                </div>
                            ) : value ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={value}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-neutral-500" />
                                </div>
                            )}
                        </div>

                        {/* Info del archivo */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span className="text-sm font-medium">Archivo cargado</span>
                            </div>
                            {previewInfo && (
                                <p className="text-xs text-neutral-400 truncate mt-1">
                                    {previewInfo.name}
                                </p>
                            )}
                            {value && (
                                <p className="text-xs text-neutral-500 truncate mt-1">
                                    {value}
                                </p>
                            )}
                        </div>

                        {/* Botón eliminar */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-neutral-800 hover:bg-red-600/20 text-neutral-400 hover:text-red-500"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                )}

                {/* Estado: Error */}
                {status === "error" && (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
                            <AlertCircle className="h-7 w-7 text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-red-400">{error}</p>
                            <p className="text-xs text-neutral-400 mt-1">
                                Haz clic para intentar de nuevo
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Alternativamente, mostrar un input para URL manual */}
            {status !== "uploading" && (
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="h-px flex-1 bg-neutral-800" />
                    <span>o pega una URL directamente</span>
                    <span className="h-px flex-1 bg-neutral-800" />
                </div>
            )}
        </div>
    );
}
