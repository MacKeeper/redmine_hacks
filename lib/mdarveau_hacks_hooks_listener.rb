class GroupSumHookListener < Redmine::Hook::ViewListener

  def view_issues_index_bottom(context = {})
    #return content to put at the end of the html body
    javascript_include_tag 'sum_estimated_remaining.js', :plugin => 'mdarveau_hacks'
  end

  def view_issues_show_description_bottom(context = {})
    #return content to put at the end of the html body
    javascript_include_tag 'issue_edit_shortcut.js', :plugin => 'mdarveau_hacks'
  end

end
