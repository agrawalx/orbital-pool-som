'use client'

import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronDownIcon, CheckIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TOKENS } from '@/lib/constants'

interface TokenSelectorProps {
  selectedToken: typeof TOKENS[number] | null
  onTokenSelect: (token: typeof TOKENS[number]) => void
  excludeTokens?: string[]
  className?: string
}

export function TokenSelector({ 
  selectedToken, 
  onTokenSelect, 
  excludeTokens = [],
  className 
}: TokenSelectorProps) {
  const availableTokens = TOKENS.filter(token => !excludeTokens.includes(token.symbol))

  return (
    <Listbox value={selectedToken} onChange={onTokenSelect}>
      <div className={cn("relative", className)}>
        <Listbox.Button className="relative w-full cursor-pointer glass-morphism rounded-xl py-3 pl-4 pr-10 text-left border border-cyan-500/20 hover:border-cyan-500/40 focus:border-cyan-500/60 focus:outline-none transition-all duration-300">
          {selectedToken ? (
            <div className="flex items-center">
              <div 
                className="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white text-sm font-bold shadow-lg"
                style={{ 
                  backgroundColor: selectedToken.color,
                  boxShadow: `0 0 15px ${selectedToken.color}40`
                }}
              >
                {selectedToken.symbol.charAt(0)}
              </div>
              <div>
                <span className="block truncate font-bold text-white font-mono">
                  {selectedToken.symbol}
                </span>
                <span className="block truncate text-xs text-cyan-300/70 font-mono">
                  {selectedToken.name.toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <span className="block truncate text-cyan-300/50 font-mono">
              SELECT TOKEN
            </span>
          )}
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDownIcon className="h-5 w-5 text-cyan-300" aria-hidden="true" />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl glass-morphism-dark py-2 text-base shadow-2xl border border-cyan-500/20 focus:outline-none">
            {availableTokens.map((token) => (
              <Listbox.Option
                key={token.symbol}
                className={({ active }) =>
                  cn(
                    'relative cursor-pointer select-none py-3 pl-4 pr-10 transition-all duration-200',
                    active ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : 'text-white hover:bg-cyan-500/5'
                  )
                }
                value={token}
              >
                {({ selected }) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center"
                  >
                    <div 
                      className="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white text-sm font-bold shadow-lg"
                      style={{ 
                        backgroundColor: token.color,
                        boxShadow: `0 0 10px ${token.color}40`
                      }}
                    >
                      {token.symbol.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <span className={cn(
                        'block truncate font-bold font-mono',
                        selected ? 'text-cyan-300' : 'text-white'
                      )}>
                        {token.symbol}
                      </span>
                      <span className="block truncate text-sm text-cyan-300/70 font-mono">
                        {token.name.toUpperCase()}
                      </span>
                    </div>
                    {selected && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-cyan-400">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </motion.div>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  )
}