require_dependency 'mdarveau_hacks_hooks_listener'

Redmine::Plugin.register :mdarveau_hacks do
  name 'Collection of redmine hacks'
  author 'Manuel Darveau'
  description 'Add estimated time and reminaing time sum in issues group'
  version '0.0.1'
  url 'https://github.com/mdarveau/redmine_hacks'
end
