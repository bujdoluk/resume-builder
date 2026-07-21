
import { Font } from "@react-pdf/renderer";
import type { FontKey } from "@/lib/fonts";

const fontFiles: Record<FontKey, { normal: string; bold: string }> = {
  inter: {
    normal: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZs.woff",
    bold: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZs.woff",
  },
  roboto: {
    normal: "https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmQ.woff",
    bold: "https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuYjammQ.woff",
  },
  lato: {
    normal: "https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHvxo.woff",
    bold: "https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVeww.woff",
  },
  montserrat: {
    normal: "https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew9.woff",
    bold: "https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70w9.woff",
  },
  poppins: {
    normal: "https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrFJM.woff",
    bold: "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7V1g.woff",
  },
  merriweather: {
    normal: "https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDr3icqEA.woff",
    bold: "https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDrOSAqEA.woff",
  },
  playfair: {
    normal: "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDT.woff",
    bold: "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDT.woff",
  },
  lora: {
    normal: "https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787weuyJF.woff",
    bold: "https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787z5vCJF.woff",
  },
  nunito: {
    normal: "https://fonts.gstatic.com/s/nunito/v32/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshRTA.woff",
    bold: "https://fonts.gstatic.com/s/nunito/v32/XRXI3I6Li01BKofiOc5wtlZ2di8HDFwmRTA.woff",
  },
  mono: {
    normal: "https://fonts.gstatic.com/s/spacemono/v17/i7dPIFZifjKcF5UAWdDRUEU.woff",
    bold: "https://fonts.gstatic.com/s/spacemono/v17/i7dMIFZifjKcF5UAWdDRaPpZYFE.woff",
  },
  oswald: {
    normal: "https://fonts.gstatic.com/s/oswald/v57/TK3_WkUHHAIjg75cFRf3bXL8LICs1_FvgUI.woff",
    bold: "https://fonts.gstatic.com/s/oswald/v57/TK3_WkUHHAIjg75cFRf3bXL8LICs1xZogUI.woff",
  },
  raleway: {
    normal: "https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaooCM.woff",
    bold: "https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVs9pYCM.woff",
  },
};

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  for (const [key, files] of Object.entries(fontFiles) as [
    FontKey,
    { normal: string; bold: string },
  ][]) {
    Font.register({
      family: key,
      fonts: [
        { src: files.normal, fontWeight: "normal" },
        { src: files.bold, fontWeight: "bold" },
      ],
    });
  }
}
