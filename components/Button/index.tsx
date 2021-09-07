import React, { forwardRef } from 'react';
import styled from 'styled-components';

import './style.scss';

interface ButtonProps {
  element?: 'button' | 'a';
  isDisabled?: boolean;
  type?: 'primary' | 'secondary' | 'delete';
  href?: string;
  onClick?: any;
  className?: string;
  width?: '' | 'large' | 'tiny';
}

const Button: React.FC<ButtonProps> = forwardRef(
  (props: ButtonProps, ref: any) => {
    const {
      element,
      className,
      type,
      isDisabled,
      width,
      ...remainingProps
    } = props;

    if (element === 'button') {
      const StyledButton = styled.button.attrs({
        className: `${className || ''} Button Button--${type} ${
          width ? `Button--${width}` : ''
        }`,
      })``;
      return (
        <StyledButton
          ref={ref}
          type="button"
          disabled={isDisabled}
          {...remainingProps}
        />
      );
    }

    const StyledAnchor = styled.a.attrs({
      className: `${className || ''} Button Button--${type} ${
        width ? `Button--${width}` : ''
      }`,
    })``;

    return <StyledAnchor ref={ref} {...remainingProps} />;
  },
);

Button.defaultProps = {
  element: 'button',
  isDisabled: false,
  type: 'primary',
  width: '',
};

export default Button;
