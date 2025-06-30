# CAPEX/OPEX Validation Rules Implementation

## Overview

This implementation provides comprehensive validation rules for CAPEX (Capital Expenditure) and OPEX (Operating Expenditure) allocation in investment requests. The rules ensure proper financial allocation based on project types and cost thresholds, following business best practices.

## Validation Rules Implemented

### Rule 1: Total Cost Match

**Description**: CAPEX + OPEX must equal Total Project Cost  
**Condition**: `CAPEX + OPEX == TotalCost`  
**Error Message**: "CAPEX and OPEX must sum to the total project cost."

**Implementation Details**:

- Allows 1 cent tolerance for floating-point precision
- Validates that the sum of CAPEX and OPEX matches the total project cost
- Applies to all project types

### Rule 2: Minimum CAPEX for Infrastructure

**Description**: CAPEX must be at least 60% for Infrastructure projects  
**Condition**: `ProjectType == 'Infrastructure' AND (CAPEX / TotalCost) >= 0.6`  
**Error Message**: "CAPEX must be at least 60% for Infrastructure projects."

**Implementation Details**:

- Only applies to projects with category "Infrastructure"
- Requires at least 60% of total cost to be CAPEX
- Infrastructure projects typically require significant capital investment in assets and facilities

### Rule 3: Maximum OPEX for R&D

**Description**: OPEX must not exceed 60% for R&D projects  
**Condition**: `ProjectType == 'R&D' AND (OPEX / TotalCost) <= 0.6`  
**Error Message**: "OPEX must not exceed 60% for R&D projects."

**Implementation Details**:

- Only applies to projects with category "R&D"
- Limits OPEX to maximum 60% of total cost
- R&D projects should focus on operational costs and research activities

### Rule 4: No CAPEX for Maintenance

**Description**: No CAPEX allowed for Maintenance projects  
**Condition**: `ProjectType == 'Maintenance' AND CAPEX == 0`  
**Error Message**: "CAPEX is not allowed for Maintenance projects."

**Implementation Details**:

- Only applies to projects with category "Maintenance"
- Requires CAPEX to be exactly 0
- Maintenance projects should focus on operational costs only

### Rule 5: CAPEX Required for High-Value Projects

**Description**: CAPEX required for projects over ₹1,00,00,000 (1 crore)  
**Condition**: `TotalCost > 10000000 AND CAPEX > 0`  
**Error Message**: "Projects over ₹1 crore must include CAPEX."

**Implementation Details**:

- Applies to all project types when total cost exceeds threshold
- Threshold is converted to local currency using exchange rates
- Large projects typically require some CAPEX for initial setup

### Rule 6: OPEX-Only for Small Projects

**Description**: Projects under ₹5,00,000 must be OPEX-only  
**Condition**: `TotalCost < 500000 AND CAPEX == 0`  
**Error Message**: "Projects under ₹5 lakh should not include CAPEX."

**Implementation Details**:

- Applies to all project types when total cost is below threshold
- Threshold is converted to local currency using exchange rates
- Small projects are typically OPEX-only for cost efficiency

## Currency Support

### Supported Currencies

- **USD** (US Dollar) - $
- **EUR** (Euro) - €
- **GBP** (British Pound) - £
- **JPY** (Japanese Yen) - ¥
- **CAD** (Canadian Dollar) - C$
- **AUD** (Australian Dollar) - A$
- **INR** (Indian Rupee) - ₹

### Currency Conversion

Thresholds are automatically converted from INR to other currencies:

- 1 INR = 0.013 USD
- 1 INR = 0.012 EUR
- 1 INR = 0.010 GBP
- 1 INR = 1.85 JPY
- 1 INR = 0.018 CAD
- 1 INR = 0.020 AUD

### Indian Numbering System

For INR currency, amounts are displayed using the Indian numbering system:

- **Lakh**: 100,000 (₹5.00 lakh)
- **Crore**: 10,000,000 (₹1.50 crore)

## Implementation Architecture

### Core Files

#### 1. `src/lib/validationRules.ts`

**Main validation engine** containing:

- `ValidationRule` interface definition
- All 6 validation rules implementation
- Currency conversion utilities
- Validation result interfaces

#### 2. `src/components/ValidationPanel.tsx`

**UI component** providing:

- Real-time validation feedback
- Visual status indicators
- Cost breakdown display
- Business insights
- Threshold information

#### 3. `src/components/SubmitRequest.tsx`

**Integration point** where:

- Validation panel is embedded in Financial Data step
- Real-time validation updates
- Error display and handling

### Key Functions

#### `validateInvestmentRequest(data: ValidationData): ValidationResult`

- Main validation function
- Runs all applicable rules
- Returns validation status with errors and warnings

#### `getRulesForCategory(category: string): ValidationRule[]`

- Returns rules applicable to specific project category
- Filters rules based on business logic

#### `getValidationSummary(data: ValidationData)`

- Provides validation statistics
- Shows passed/failed rule counts
- Used for UI display

## User Interface Features

### Validation Panel Components

#### 1. Validation Summary

- **Green**: All rules passed
- **Yellow**: Some rules failed (warnings)
- **Red**: Critical validation errors
- Shows rule pass/fail count

#### 2. Cost Breakdown

- Visual display of CAPEX vs OPEX allocation
- Percentage breakdowns
- Total cost summary

#### 3. Validation Rules Display

- Shows all applicable rules for the selected category
- Visual indicators for pass/fail status
- Detailed error messages for failed rules

#### 4. Business Insights

- Category-specific guidance
- Best practice recommendations
- Threshold explanations

#### 5. Threshold Information

- Currency-specific threshold values
- High-value and small project guidelines

## Integration with SubmitRequest

### Financial Data Step Enhancement

The Financial Data step (Step 3) now includes:

- **Two-column layout**: Financial inputs on left, validation panel on right
- **Real-time validation**: Updates as user types
- **Error summary**: Displays validation errors at bottom
- **Visual feedback**: Color-coded status indicators

### Validation Flow

1. User enters CAPEX and OPEX values
2. Validation panel updates in real-time
3. Applicable rules are checked based on category
4. Visual feedback shows pass/fail status
5. Error messages guide user to correct issues

## Testing

### Test Coverage

Comprehensive test suite in `src/lib/validationRules.test.ts` covers:

- All 6 validation rules with positive and negative test cases
- Category-specific rule filtering
- Currency conversion and formatting
- Edge cases and error conditions
- Complex scenarios with multiple rule violations

### Test Categories

1. **Rule-specific tests**: Each rule tested individually
2. **Category tests**: Rule filtering by project category
3. **Currency tests**: Formatting and conversion
4. **Edge cases**: Zero values, boundary conditions
5. **Integration tests**: Multiple rules together

## Business Benefits

### 1. Financial Accuracy

- Ensures proper CAPEX/OPEX allocation
- Prevents budget mismatches
- Validates against business rules

### 2. Project Type Compliance

- Enforces category-specific requirements
- Guides users to appropriate allocations
- Maintains consistency across projects

### 3. Cost Optimization

- Prevents over-allocation of CAPEX for small projects
- Ensures adequate CAPEX for large projects
- Optimizes resource allocation

### 4. User Guidance

- Real-time feedback during data entry
- Clear error messages and explanations
- Business insights and best practices

### 5. Compliance

- Enforces organizational financial policies
- Maintains audit trail of validation
- Supports regulatory requirements

## Future Enhancements

### Potential Additions

1. **Dynamic thresholds**: Configurable thresholds based on organization
2. **Currency API integration**: Real-time exchange rates
3. **Advanced rules**: More complex business logic
4. **Audit logging**: Track validation history
5. **Approval workflows**: Integration with approval processes

### Extensibility

The validation system is designed to be easily extensible:

- New rules can be added to the `validationRules` array
- Categories can be extended with new validation logic
- Currency support can be expanded
- UI components are modular and reusable

## Usage Examples

### Infrastructure Project

```typescript
const data = {
  capex: 600000, // 60% of 1M
  opex: 400000, // 40% of 1M
  totalCost: 1000000,
  category: 'Infrastructure',
  currency: 'USD',
};
// ✅ Passes all validation rules
```

### R&D Project

```typescript
const data = {
  capex: 500000, // 50% of 1M
  opex: 500000, // 50% of 1M
  totalCost: 1000000,
  category: 'R&D',
  currency: 'USD',
};
// ✅ Passes all validation rules
```

### Maintenance Project

```typescript
const data = {
  capex: 0, // No CAPEX allowed
  opex: 1000000, // 100% OPEX
  totalCost: 1000000,
  category: 'Maintenance',
  currency: 'USD',
};
// ✅ Passes all validation rules
```

This implementation provides a robust, user-friendly validation system that ensures proper financial allocation while guiding users toward best practices for their specific project types.
