/*!
 * ClickToAddress for Shopify by Crafty Clicks
 *
 * @author		Crafty Clicks Limited
 * @link		https://craftyclicks.co.uk
 * @copyright	Copyright (c) 2016, Crafty Clicks Limited
 * @license		Licensed under the terms of the MIT license.
 * @version		0.3.0

 Live: 5e05d-530b3-cbbbc-0215b

 */

function loadSettings(){
	var cc_settings = {
	    accessToken: '8cc36-ae995-8c5a9-0243c',
		ambient: 'light',
		accent: 'default',
		showLogo: false,
		hideFields: true,
		searchLocation: false,
		addPadding: true,
		text_search_label: 'Search for your address by entering a postcode or street name in the box below:',
		tag: 'nopCommerce-tid-482843'
	};
	return cc_settings;
}

$.getScript('https://cc-cdn.com/generic/scripts/v1/cc_c2a.min.js');

//Check whether Script from CDN is loaded
function waitForCraftyCDN() {
	if (typeof clickToAddress === 'undefined') {
		setTimeout(waitForCraftyCDN, 50);
	}
	else insertCraftyAddressAutoComplete();
}

waitForCraftyCDN();

function insertCraftyAddressAutoComplete(){
	$(document).ready(function(){
		//we need a cc_search check, because if it exists, then we shall not create a new one
		if (typeof cc_search === 'undefined') {
			var cc_search = null;
		}

		//minimise footprint, load settings only once per page
		if(typeof cc_settings === 'undefined'){
			loadSettings();
		}
		addLookup(loadSettings());
	});
}

function addLookup(cc_settings){
	var config = {
		accessToken: cc_settings.accessToken,
		domMode: 'object',
		gfxMode: '1',
		style: {
			ambient: cc_settings.ambient,
			accent: cc_settings.accent
		},
		tag: 'NopCommerce',
		showLogo: cc_settings.showLogo,
		countrySelector: true,
		countryMatchWith: 'text',
		enabledCountries: countriesByNopCommerce(),
		onResultSelected: function (c2a, elements, address) {
			$(elements.country).trigger('change');
			$(elements.country).closest('form').find('div[cc-hide="1"]').show();
			$(document).ajaxStop(function () {
				var county = { code: address.province_code, name: address.province_name, preferred: address.province };
				var county_obj = jQuery('#' + elements.county.id);
				c2a.setCounty(county_obj[0], county);
				if (county_obj.val() === null) county_obj.val(0);
				county_obj.trigger('change');
			});
		}
	};
	if(typeof cc_search === 'undefined') cc_search = new clickToAddress(config);

	var billingForm = $('form#co-billing-form');
	var shippingForm = $('form#co-shipping-form');
	var addressBookForm = $('#Address_City').closest('form'); //no ID for address book form, thus let the traversing begin

	var prefixes = [];
	if (billingForm.length && billingForm.find('#BillingNewAddress_ZipPostalCode').length > 0) prefixes.push('BillingNewAddress_');
	if (shippingForm.length && shippingForm.find('#ShippingNewAddress_ZipPostalCode').length > 0) prefixes.push('ShippingNewAddress_');
	if (addressBookForm.length) prefixes.push('Address_');
	prefixes.forEach(function (elem) {
		_add_lookup(cc_settings, {
			prefix: elem,
			fields: {
				postcode_obj: $('#' + elem + 'ZipPostalCode')[0],
				company_obj: $('#' + elem + 'Company')[0],
				street1_obj: $('#' + elem + 'Address1')[0],
				street2_obj: $('#' + elem + 'Address2')[0],
				town_obj: $('#' + elem + 'City')[0],
				county_obj: $('#' + elem + 'StateProvinceId')[0],
				country_obj: $('#' + elem + 'CountryId')[0]
			}
		});
	});
}

function _add_lookup(cc_settings, nopCommerceCfg) {
	var prefix = nopCommerceCfg.prefix;
	if ($(nopCommerceCfg.fields.street1_obj).closest('form').find('input[cc_applied="true"]').length) return;
	var cfg = {
		line_1: nopCommerceCfg.fields.street1_obj,
		line_2: nopCommerceCfg.fields.street2_obj,
		town: nopCommerceCfg.fields.town_obj,
		postcode: nopCommerceCfg.fields.postcode_obj,
		county: nopCommerceCfg.fields.county_obj,
		country: nopCommerceCfg.fields.country_obj,
		company: nopCommerceCfg.fields.company_obj,
	};
	if (!cc_settings.searchLocation) {
		var tmp_html = $('<div class="inputs cc_inputs"><label id="cc_label_' + prefix + '" >' + cc_settings.text_search_label + '</label>' +
						'<input name="' + prefix + 'cc_search_input" id="' + prefix + 'cc_search_input" ' +
						'class="text-box single-line cc_search_input" placeholder="Enter a postcode or street name to start searching for an address" type="text"></input></div>');
		tmp_html.insertBefore($(cfg.line_1).closest('div.inputs'));

		if (cc_settings.addPadding) $('.cc_inputs').css('padding', '20px 0px');
	}
	if (cc_settings.hideFields && !cc_settings.searchLocation && $(cfg.town).val() === '') {
		var manual_html_label;
		var usecrafty_html_label;
		var target;

		// These will be used as css for hide/reveal buttons
		var manual_css = {
			'font-size': '11px !important',
			'padding-right': '0.5em',
			'cursor': 'pointer'
		};

		var reveal_css = {
			'font-size': '11px !important',
			'padding-right': '0.5em',
			'cursor': 'pointer'
		};
		var domKeys = Object.keys(cfg);
		for (var iDom = 0; iDom < domKeys.length; iDom++) {
			$(cfg[domKeys[iDom]]).closest('div.inputs').attr('cc-hide', 1);
		}
		manual_html_label = $('<label class="cc_manual">Or click here to enter your address manually</label>');
		usecrafty_html_label = $('<label class="cc_reveal" style="display: none">Click here to search for your address by streetname or postcode</label>');
		target = $('#cc_label_' + prefix);
		manual_html_label.css(manual_css);
		usecrafty_html_label.css(reveal_css);
		target.after(usecrafty_html_label).after(manual_html_label);
		manual_html_label.closest('div').css('font-size', '1em');
		$(cfg.town).closest('form').find('[cc-hide=1]').hide(400);

		manual_html_label.click(function () {
			$(this).closest('form').find('[cc-hide=1]').show(400);
			$(this).closest('form').find('.cc_search_input').hide(400);
			$(this).hide(400);
			target.hide(400);
			$(this).closest('form').find('.cc_reveal').show(400);
		});

		usecrafty_html_label.click(function () {
			$(this).closest('form').find('.cc_search_input').show(400);
			$(this).hide(400);
			target.show(400);
			$(this).closest('form').find('.cc_manual').show(400);
		});
	}

	if (cc_settings.searchLocation) {
		cfg.search = nopCommerceCfg.fields.street1_obj;
	}
	else {
		cfg.search = $('#' + prefix + 'cc_search_input')[0];
	}

	cfg.company = nopCommerceCfg.fields.company_obj;
	cc_search.attach(cfg);
}

function countriesByNopCommerce() {
	var countryNames = [];
	if ($('#BillingNewAddress_CountryId').length) { //grab the available countries for billing on checkout
		$('#BillingNewAddress_CountryId option').each(function (index, elem) {
			if ($(elem).attr('value') !== '0') {
				countryNames.push($(elem).text());
			}
		});
	}
 	if ($('#ShippingNewAddress_CountryId').length) { //grab the available countries for shipping on checkout
		$('#ShippingNewAddress_CountryId option').each(function (index, elem) {
			if ($(elem).attr('value') !== '0') {
				countryNames.push($(elem).text());
			}
		});
	}
	else if ($('#Address_CountryId').length) { //grab the available countries for shipping on checkout
		$('#Address_CountryId option').each(function (index, elem) {
			if ($(elem).attr('value') !== '0') {
				countryNames.push($(elem).text());
			}
		});
	}
	return countryNames;
}
