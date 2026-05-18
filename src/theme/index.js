// =============================================================================
// ptraker Theme Configuration
// =============================================================================
// All design tokens defined in one place.
// Import this into App.jsx and wrap with <ConfigProvider theme={ptrackerTheme}>
//
// Brand palette from logo:
//   Dark background:  #1a1d23
//   Golden accent:    #f5a623
//   White text:       #ffffff
//   Secondary text:   #a0a0a0
// =============================================================================

export const brandColors = {
  gold:           '#f5a623',
  goldHover:      '#f7b84b',
  goldActive:     '#d4891a',
  darkBg:         '#1a1d23',
  darkCard:       '#22262e',
  darkBorder:     '#2e3340',
  darkHover:      '#2a2d35',
  textPrimary:    '#ffffff',
  textSecondary:  '#a0a0a0',
  textMuted:      '#6b7280',

  // Semantic colors
  gain:           '#52c41a',   // green for positive gain/loss
  gainBg:         '#162312',
  loss:           '#ff4d4f',   // red for negative gain/loss
  lossBg:         '#2a1215',
  neutral:        '#8c8c8c',
};

// Dark theme tokens
const darkTheme = {
  token: {
    // Brand
    colorPrimary:         brandColors.gold,
    colorPrimaryHover:    brandColors.goldHover,
    colorPrimaryActive:   brandColors.goldActive,

    // Background
    colorBgBase:          brandColors.darkBg,
    colorBgContainer:     brandColors.darkCard,
    colorBgElevated:      brandColors.darkCard,
    colorBgLayout:        brandColors.darkBg,
    colorBgSpotlight:     brandColors.darkHover,

    // Border
    colorBorder:          brandColors.darkBorder,
    colorBorderSecondary: brandColors.darkBorder,

    // Text
    colorText:            brandColors.textPrimary,
    colorTextSecondary:   brandColors.textSecondary,
    colorTextTertiary:    brandColors.textMuted,
    colorTextQuaternary:  brandColors.textMuted,

    // Typography
    fontFamily:           "'DM Sans', 'Inter', sans-serif",
    fontSize:             14,
    fontSizeLG:           16,
    fontSizeXL:           20,
    fontSizeHeading1:     32,
    fontSizeHeading2:     24,
    fontSizeHeading3:     20,

    // Shape
    borderRadius:         8,
    borderRadiusLG:       12,
    borderRadiusSM:       6,

    // Spacing
    padding:              16,
    paddingLG:            24,
    paddingSM:            12,
    paddingXS:            8,

    // Motion
    motionDurationMid:    '0.2s',

    // Split line
    colorSplit:           brandColors.darkBorder,

    // Link
    colorLink:            brandColors.gold,
    colorLinkHover:       brandColors.goldHover,
    colorLinkActive:      brandColors.goldActive,
  },
  components: {
    Layout: {
      siderBg:            brandColors.darkBg,
      headerBg:           brandColors.darkCard,
      bodyBg:             brandColors.darkBg,
      triggerBg:          brandColors.darkHover,
      triggerColor:       brandColors.textSecondary,
    },
    Menu: {
      darkItemBg:         brandColors.darkBg,
      darkItemSelectedBg: brandColors.darkHover,
      darkItemHoverBg:    brandColors.darkHover,
      darkItemColor:      brandColors.textSecondary,
      darkItemSelectedColor: brandColors.gold,
      darkItemHoverColor: brandColors.textPrimary,
      darkSubMenuItemBg:  brandColors.darkBg,
      itemBorderRadius:   8,
    },
    Table: {
      headerBg:           brandColors.darkHover,
      headerColor:        brandColors.textSecondary,
      rowHoverBg:         brandColors.darkHover,
      borderColor:        brandColors.darkBorder,
      headerSortActiveBg: brandColors.darkHover,
      bodySortBg:         'transparent',
    },
    Card: {
      colorBgContainer:   brandColors.darkCard,
      colorBorderSecondary: brandColors.darkBorder,
      paddingLG:          20,
    },
    Button: {
      primaryColor:       '#000000',   // black text on gold button
      defaultBg:          brandColors.darkHover,
      defaultColor:       brandColors.textPrimary,
      defaultBorderColor: brandColors.darkBorder,
    },
    Input: {
      colorBgContainer:   brandColors.darkHover,
      colorBorder:        brandColors.darkBorder,
      colorText:          brandColors.textPrimary,
      colorTextPlaceholder: brandColors.textMuted,
      activeBorderColor:  brandColors.gold,
      hoverBorderColor:   brandColors.goldHover,
    },
    Select: {
      colorBgContainer:   brandColors.darkHover,
      colorBorder:        brandColors.darkBorder,
      colorText:          brandColors.textPrimary,
      optionSelectedBg:   brandColors.darkBorder,
    },
    Statistic: {
      contentFontSize:    28,
      titleFontSize:      13,
    },
    Tag: {
      defaultBg:          brandColors.darkHover,
      defaultColor:       brandColors.textSecondary,
    },
    Tabs: {
      inkBarColor:        brandColors.gold,
      itemSelectedColor:  brandColors.gold,
      itemHoverColor:     brandColors.goldHover,
      itemColor:          brandColors.textSecondary,
      cardBg:             brandColors.darkCard,
    },
    Upload: {
      colorBgContainer:   brandColors.darkHover,
    },
    Modal: {
      contentBg:          brandColors.darkCard,
      headerBg:           brandColors.darkCard,
      footerBg:           brandColors.darkCard,
    },
    Drawer: {
      colorBgElevated:    brandColors.darkCard,
    },
    Tooltip: {
      colorBgSpotlight:   brandColors.darkHover,
    },
    Badge: {
      colorBgContainer:   brandColors.darkCard,
    },
    Divider: {
      colorSplit:         brandColors.darkBorder,
    },
    Form: {
      labelColor:         brandColors.textSecondary,
      itemMarginBottom:   20,
    },
    Alert: {
      colorInfoBg:        '#111d2c',
      colorWarningBg:     '#2b1d11',
      colorErrorBg:       brandColors.lossBg,
      colorSuccessBg:     brandColors.gainBg,
    },
  },
};

// Light theme tokens — same gold accent, white background
const lightTheme = {
  token: {
    colorPrimary:         brandColors.gold,
    colorPrimaryHover:    brandColors.goldHover,
    colorPrimaryActive:   brandColors.goldActive,

    fontFamily:           "'DM Sans', 'Inter', sans-serif",
    fontSize:             14,
    borderRadius:         8,
    borderRadiusLG:       12,

    colorLink:            '#d4891a',
    colorLinkHover:       brandColors.gold,
  },
  components: {
    Button: {
      primaryColor:       '#000000',
    },
    Menu: {
      itemSelectedColor:  brandColors.goldActive,
      itemSelectedBg:     '#fff7e6',
    },
    Tabs: {
      inkBarColor:        brandColors.gold,
      itemSelectedColor:  brandColors.goldActive,
    },
  },
};

export { darkTheme, lightTheme };
