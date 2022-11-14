import React, { useState } from 'react';
import Image from 'next/image'
import style from "../pages/doodles.module.scss"

const LightBox = ({ children, src, alt }) => {
	const [isOpen, setIsOpen] = useState(false);

	const toggleIsOpen = () => {
		setIsOpen(!isOpen);
	};

	return (
		<div onClick={toggleIsOpen}>
			{children}
			{isOpen ?
				<div onClick={toggleIsOpen} className={style.lightbox}>
					<Image
						src={src}
						alt={alt}
						fill
					/>
				</div>
				: null}
		</div>
	);
};

export default LightBox;