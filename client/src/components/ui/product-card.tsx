"use client"

import * as React from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { InfiniteSlider } from "./infinite-slider"

interface ProductImagesProps {
  id: string
  color: string
  images: string[]
}
interface ProductCardImagesProps {
  productImages: ProductImagesProps[]
  activeColor: number
  activeImage: number
  handleMouse: (event: "enter" | "leave") => void
  className?: string
}
const variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } }
function useSetActiveProduct(initialColor = 0) {
  const [state, setState] = React.useState({
    activeColor: initialColor,
    activeImage: 0,
  })

  const handleColorChange = React.useCallback((index: number) => {
    setState((prev) => ({ ...prev, activeColor: index }))
  }, [])

  const handleMouse = React.useCallback((event: "enter" | "leave") => {
    setState((prev) => ({
      ...prev,
      activeImage: event === "enter" ? 1 : 0,
    }))
  }, [])

  return {
    ...state,
    handleColorChange,
    handleMouse,
  }
}
function ProductCardImages({
  productImages,
  activeColor,
  activeImage,
  handleMouse,
  className,
}: ProductCardImagesProps) {
  const handleMouseEnter = () => handleMouse("enter")
  const handleMouseLeave = () => handleMouse("leave")

  return (
    <div className={cn("relative aspect-video", className)}>
      {productImages.map((productImage, index) => (
        <motion.div
          key={productImage.id}
          variants={variants}
          animate={index === activeColor ? "visible" : "hidden"}
          className="absolute inset-0 cursor-pointer overflow-hidden"
          exit={"hidden"}
        >
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <AnimatePresence>
              <motion.div
                key={0}
                variants={variants}
                className="pointer-events-none"
                exit="hidden"
              >
                <Image
                  alt={`Product image ${index + 1} in ${
                    productImage.color
                  } color`}
                  fill
                  className="object-contain"
                  src={productImage.images[0]}
                />
              </motion.div>
              <motion.div
                key={1}
                variants={variants}
                className="pointer-events-none absolute inset-0 size-full"
                animate={
                  activeImage === 1 &&
                  productImage.id === productImages[activeColor].id
                    ? "visible"
                    : "hidden"
                }
                exit="hidden"
              >
                <Image
                  alt={`Product image ${index + 1} in ${
                    productImage.color
                  } color`}
                  fill
                  className="object-contain"
                  src={productImage.images[1]}
                  loading="lazy"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
const springTransition = {
  type: "spring",
  stiffness: 500,
  damping: 50,
  mass: 1,
}
interface ProductColorsThumbsProps {
  productId: string
  productColors: string[]
  activeColor: number
  setActiveColor: (index: number) => void
  className?: string
}
function ProductColorsThumbs({
  productId,
  productColors,
  activeColor,
  setActiveColor,
  className
}: ProductColorsThumbsProps) {
  return (
    <div className={cn("my-2 flex gap-2 px-4", className)}>
      {productColors.map((productColor, index) => (
        <button
          key={productColor}
          role="button"
          aria-label="show product color"
          className="relative size-4 appearance-none rounded-full border border-neutral-200"
          style={{ backgroundColor: productColor }}
          onMouseEnter={() => setActiveColor(index)}
          title={productColor}
        >
          {index === activeColor && (
            <motion.div
              layoutId={productId}
              className="absolute -left-[2px] -top-[2px] size-[18px] rounded-full border border-gray-500"
              transition={springTransition}
            />
          )}
        </button>
      ))}
    </div>
  )
}

interface ProductCardProps {
  id: string
  name: string
  sizes: string[]
  images: ProductImagesProps[]
  colors: string[]
  className?: string
  onSimpleProduct?: () => void
  onCustomProduct?: () => void
}
export function ProductCard({
  id,
  name,
  sizes,
  images,
  colors,
  className,
  onSimpleProduct,
  onCustomProduct,
}: ProductCardProps) {
  const { activeColor, activeImage, handleColorChange, handleMouse } =
    useSetActiveProduct()
  const [isCardHovered, setIsCardHovered] = React.useState(false)
  
  return (
    <div 
      id={id} 
      className={cn("relative px-4 py-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow", className)}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
      <ProductCardImages
        productImages={images}
        activeColor={activeColor}
        activeImage={activeImage}
        handleMouse={handleMouse}
      />

      <ProductColorsThumbs
        productId={id}
        productColors={colors}
        activeColor={activeColor}
        setActiveColor={handleColorChange}
      />
      
      {/* Product Name */}
      <div className="px-4 mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {name}
        </h3>
      </div>
      

      
      {/* Sizes */}
      <div className="px-4 mb-4">
        {/* Desktop: Use slider for multiple sizes, mobile/tablet: Show all sizes in flex wrap */}
        <div className="hidden lg:block">
          {sizes.length > 1 ? (
            <InfiniteSlider gap={8} duration={15} className="h-8" isPaused={isCardHovered}>
              {sizes.map((size, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full whitespace-nowrap"
                >
                  {size}
                </span>
              ))}
            </InfiniteSlider>
          ) : (
            <div className="flex justify-center">
              <span className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                {sizes[0]}
              </span>
            </div>
          )}
        </div>
        
        {/* Mobile/Tablet: Show all sizes in flex wrap */}
        <div className="lg:hidden">
          <div className="flex flex-wrap gap-2 justify-center">
            {sizes.map((size, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full whitespace-nowrap"
              >
                {size}
              </span>
            ))}
          </div>
        </div>
      </div>
        
        {/* Action Buttons */}
      <div className="px-4 flex gap-2 lg:flex-col lg:gap-2">
        <button
          onClick={onSimpleProduct}
          className="flex-1 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Simple
        </button>
        <button
          onClick={onCustomProduct}
          className="flex-1 px-4 py-2 bg-white text-black text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Customize Product
        </button>
      </div>
    </div>
  )
}