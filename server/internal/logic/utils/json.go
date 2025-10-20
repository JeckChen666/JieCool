package utils

import (
	"encoding/json"
	"fmt"
)

// NormalizeJSONValue converts the incoming value according to the given type
// into a valid JSON text string suitable for inserting into a JSON/JSONB column.
//
// Rules:
// - type=string: ensure the value is a JSON string (e.g., "hello")
// - type=json: if value is string, validate it's valid JSON text; otherwise marshal
// - type=number/bool: marshal the value to JSON (e.g., 123, true)
func NormalizeJSONValue(t string, v interface{}) (string, error) {
	switch t {
	case "string":
		// Always marshal to JSON string
		var s string
		switch vv := v.(type) {
		case string:
			s = vv
		default:
			s = fmt.Sprintf("%v", vv)
		}
		b, err := json.Marshal(s)
		if err != nil {
			return "", err
		}
		return string(b), nil
	case "json":
		// Accept JSON text or marshal objects/arrays
		switch vv := v.(type) {
		case string:
			// Validate JSON text
			var tmp interface{}
			if err := json.Unmarshal([]byte(vv), &tmp); err != nil {
				return "", fmt.Errorf("invalid json text: %w", err)
			}
			return vv, nil
		default:
			b, err := json.Marshal(v)
			if err != nil {
				return "", err
			}
			return string(b), nil
		}
	case "number", "bool":
		b, err := json.Marshal(v)
		if err != nil {
			return "", err
		}
		return string(b), nil
	default:
		return "", fmt.Errorf("unsupported type: %s", t)
	}
}

// DecodeJSONText decodes a JSON text (from JSON/JSONB column) into a Go value
// for API responses. If decoding fails, it returns the original text.
func DecodeJSONText(text string) interface{} {
	var out interface{}
	if err := json.Unmarshal([]byte(text), &out); err != nil {
		// Fallback: return the original text
		return text
	}
	return out
}
