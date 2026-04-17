'use client'

import React from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Search, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface SearchPickerDialogProps<T> {
    open: boolean
    onOpenChange: (open: boolean) => void

    title: string
    placeholder?: string
    searchValue: string
    onSearchChange: (value: string) => void
    onClearSearch?: () => void

    items: T[]
    loading?: boolean

    emptyMessage?: string
    emptySubMessage?: string
    idleMessage?: string

    renderItem: (item: T) => React.ReactNode
    getKey: (item: T, index: number) => string | number
    onSelect: (item: T) => void

    widthClassName?: string
    heightClassName?: string
    searchTransform?: (value: string) => string
}

export default function SearchPickerDialog<T>({
                                                  open,
                                                  onOpenChange,
                                                  title,
                                                  placeholder = 'Buscar...',
                                                  searchValue,
                                                  onSearchChange,
                                                  onClearSearch,
                                                  items,
                                                  loading = false,
                                                  emptyMessage = 'No se encontraron resultados',
                                                  emptySubMessage,
                                                  idleMessage = 'Escribe para buscar',
                                                  renderItem,
                                                  getKey,
                                                  onSelect,
                                                  widthClassName = 'sm:w-[620px]',
                                                  heightClassName = 'sm:h-[75vh]',
                                                  searchTransform = (value) => value,
                                              }: SearchPickerDialogProps<T>) {
    const handleClose = () => {
        onOpenChange(false)
        onClearSearch?.()
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                onOpenChange(value)
                if (!value) onClearSearch?.()
            }}
        >
            <DialogContent
                className={`p-0 gap-0 flex flex-col [&>button]:hidden overflow-hidden
        fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0
        rounded-t-2xl rounded-b-none h-[88vh] w-full
        sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2
        sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl
        ${widthClassName} ${heightClassName} sm:max-w-[95vw]`}
            >
                <DialogTitle className="sr-only">{title}</DialogTitle>

                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 bg-white dark:bg-gray-900">
                    <Search className="h-4 w-4 text-gray-400 shrink-0" />

                    <input
                        type="text"
                        autoFocus
                        placeholder={placeholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange(searchTransform(e.target.value))}
                        className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 h-9"
                    />

                    {searchValue && (
                        <button
                            type="button"
                            onClick={() => {
                                onSearchChange('')
                                onClearSearch?.()
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-sm text-blue-600 dark:text-blue-400 font-medium pl-2 shrink-0"
                    >
                        Cancelar
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                    {loading ? (
                        <div className="p-3 space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="flex gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
                                >
                                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-4 w-3/5 rounded" />
                                        <Skeleton className="h-3 w-2/5 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-12 text-center">
                            <Search className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {searchValue ? emptyMessage : idleMessage}
                            </p>
                            {searchValue && emptySubMessage && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {emptySubMessage}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {items.map((item, index) => (
                                <button
                                    key={getKey(item, index)}
                                    type="button"
                                    onClick={() => {
                                        onSelect(item)
                                        onOpenChange(false)
                                        onClearSearch?.()
                                    }}
                                    className="w-full text-left hover:bg-blue-50 dark:hover:bg-blue-950/20 active:bg-blue-100 dark:active:bg-blue-950/40 transition-colors"
                                >
                                    {renderItem(item)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}