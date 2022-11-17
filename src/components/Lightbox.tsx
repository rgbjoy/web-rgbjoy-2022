import React, { useState } from 'react';
import Image from 'next/legacy/image'
import style from "../pages/doodles.module.scss"

const LightBox = ({ children, image }) => {
	const [isOpen, setIsOpen] = useState(false);

	const toggleIsOpen = () => {
		setIsOpen(!isOpen);
	};

	return (
		<div onClick={toggleIsOpen}>
			{children}
			{isOpen ?
				<div onClick={toggleIsOpen} className={style.lightbox}>
					<div className={style.lightbox__inner}>
						<Image
							src={image.source}
							alt={image.alt}
							placeholder="blur"
							blurDataURL={image.smallImage["sourceUrl"]}
							quality={100}
							layout="fill"
						/>
					</div>
				</div>
				: null}
		</div>
	);
};

export default LightBox;