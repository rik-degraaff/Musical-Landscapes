import React from 'react';
import './gesture.css';

/** Authored silhouettes keep the fingertip and wrist clear at compact sizes. */
export function GestureHand({pose='point',className=''}) {
  return <svg className={`gesture-hand hand-${pose} ${className}`} viewBox="0 0 90 95" aria-hidden="true" focusable="false">
    {pose==='pressed'?<>
      <path d="M25 85 12 61Q7 52 13 48Q19 44 28 57V29Q25 19 28 12Q30 6 35 6Q40 6 43 13L48 27Q50 33 46 40Q52 37 56 45Q59 40 64 42Q69 43 69 51Q80 47 80 59Q80 73 64 87Z"/>
      <path className="hand-crease" d="M35 64Q49 55 62 64M34 79H57M43 46V54M56 47V56M33 24Q37 21 42 24"/>
    </>:<>
      <path d="M25 85 12 61Q7 52 13 48Q19 44 28 57V15Q28 6 35 6Q42 6 42 15V44Q44 37 50 38Q55 38 56 45Q59 40 64 42Q69 43 69 51Q80 47 80 59Q80 73 64 87Z"/>
      <path className="hand-crease" d="M35 64Q49 55 62 64M34 79H57M43 46V54M56 47V56"/>
    </>}
  </svg>;
}
