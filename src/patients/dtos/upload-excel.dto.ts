import { IsString, Length, Matches, IsOptional } from 'class-validator';

export class UploadExcelDto {
  @IsOptional()
  @IsString()
  @Length(0, 255)
  chartNumber?: string;

  @IsString()
  @Length(1, 255)
  name: string;

  /**
  '01012345678'        ✅
  '010-1234-5678'      ✅
   */
  @IsOptional()
  @Matches(/^(010\d{8}|010-\d{4}-\d{4})$/, { 
    message: '전화번호 형식이 잘못되었습니다.' 
  })
  phoneRaw?: string;

  /**
   * 900101 ✅
   * 9001011 ✅
   * 900101-1 ✅
   * 900101-1234567 ✅
   * 900101-1****** ✅
   */
  @IsOptional()
  @Matches(/^(\d{6}|\d{7}|\d{6}-\d{1}|\d{6}-\d{1}[\d*]{6})$/, { 
    message: '주민등록번호 형식이 잘못되었습니다. ' 
  })
  rrnRaw: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  memo?: string;
}
