import { ReqoreModal } from '@qoretechnologies/reqore';
import { IReqoreModalProps } from '@qoretechnologies/reqore/dist/components/Modal';
import { useMemo, useState } from 'react';

export interface IGuidePage {
  label: string;
  content: IReqoreModalProps['children'];
}

export interface IGuideProps extends Omit<IReqoreModalProps, 'children'> {
  pages: IGuidePage[];
}

export const Guide = ({ pages }: IGuideProps) => {
  const [currentPage, setCurrentPage] = useState(0);

  const page = useMemo(() => pages[currentPage], [currentPage, pages]);

  return (
    <ReqoreModal isOpen minimal label={page.label}>
      {page.content}
    </ReqoreModal>
  );
};
